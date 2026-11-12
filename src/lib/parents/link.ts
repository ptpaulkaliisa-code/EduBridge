import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { queueSMS, parentWelcomeMessage } from "@/lib/notifications/queue";

export interface ParentLinkResult {
  // users.id to store on students.parent_id, or null when no parent
  // login can be attached to this number (see `warning`).
  parentId: string | null;
  // True only when this call created the account, so the caller knows
  // to queue the welcome SMS once.
  created: boolean;
  warning?: string;
}

// Finds or creates the parent login for a phone number (PRD 5.2, Parent
// Linking). One account per phone; a parent with several children —
// even at different schools — gets one login that sees all of them,
// because parent access is resolved through students.parent_id.
//
// Parent rows are created with school_id NULL on purpose. Every
// school_isolation RLS policy grants access when users.school_id
// matches, with no role check, so a parent with a school_id would see
// every family's records. See migration 011 for the full reasoning.
//
// Uses the admin client: users has no INSERT policy for authenticated
// roles, the same as teacher creation in /api/teachers.
export async function linkParentAccount(params: {
  phoneNumber: string;
  parentName?: string;
  studentName: string;
}): Promise<ParentLinkResult> {
  const admin = createAdminClient();

  const existing = await findByPhone(params.phoneNumber);
  if (existing) return fromExisting(existing);

  const { data: created, error } = await admin
    .from("users")
    .insert({
      phone_number: params.phoneNumber,
      full_name: params.parentName?.trim() || `Parent of ${params.studentName}`,
      role: "parent",
      school_id: null,
    })
    .select("id")
    .single();

  if (created) return { parentId: created.id, created: true };

  // Unique violation: another request registered this number between
  // our lookup and insert. Use whatever account won.
  if (error?.code === "23505") {
    const raced = await findByPhone(params.phoneNumber);
    if (raced) return fromExisting(raced);
  }

  throw new Error(`Could not create parent account: ${error?.message ?? "unknown error"}`);
}

// Queued, not sent: delivery waits on the process-sms worker.
export async function queueParentWelcome(params: {
  schoolId: string;
  phoneNumber: string;
  parentId: string;
  studentName: string;
}) {
  const admin = createAdminClient();
  const { data: school } = await admin
    .from("schools")
    .select("name")
    .eq("id", params.schoolId)
    .maybeSingle();

  await queueSMS({
    schoolId: params.schoolId,
    recipientPhone: params.phoneNumber,
    recipientUserId: params.parentId,
    type: "reminder",
    message: parentWelcomeMessage(school?.name ?? "Your school", params.studentName),
  });
}

async function findByPhone(phoneNumber: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, role")
    .eq("phone_number", phoneNumber)
    .maybeSingle();
  if (error) throw new Error(`Could not look up parent account: ${error.message}`);
  return data as { id: string; role: string } | null;
}

function fromExisting(user: { id: string; role: string }): ParentLinkResult {
  if (user.role === "parent") return { parentId: user.id, created: false };

  // users.role holds one role per phone number, so a staff member's
  // number can't also be a parent login without a schema change.
  return {
    parentId: null,
    created: false,
    warning:
      "This phone number belongs to a staff account, so it can't also be a parent login. The student was saved, and SMS alerts will still go to this number.",
  };
}
