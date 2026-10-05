/**
 * Role-based permission system for OneNetworx Platform.
 * Central authority for what each role can do.
 */

export type UserRole = 'super_admin' | 'hr_admin' | 'screener' | 'agent' | 'applicant';

export interface PermissionMap {
    // Admin Management
    canManageAdmins: boolean;
    canViewAuditLog: boolean;
    canConfigurePlatform: boolean;

    // Content & Settings
    canEditHero: boolean;
    canEditLegalPages: boolean;
    canManageJobPositions: boolean;

    // Applicant Pipeline
    canViewAllApplicants: boolean;
    canScreenApplicants: boolean;
    canAdvanceRejectApplicants: boolean;
    canEditScreeningQuestions: boolean;
    canAddNotes: boolean;

    // Exams
    canManageExams: boolean;
    canGradeExams: boolean;

    // Interviews
    canScheduleInterviews: boolean;
    canConductInterviews: boolean;

    // Email
    canSendEmails: boolean;

    // Contracts
    canManageContracts: boolean;
    canSignContracts: boolean;

    // Training
    canManageTraining: boolean;
    canAccessTraining: boolean;

    // Export
    canExportData: boolean;

    // Personal
    canViewOwnApplication: boolean;
    canTakeExams: boolean;
    canViewOwnDashboard: boolean;
}

const PERMISSIONS: Record<UserRole, PermissionMap> = {
    super_admin: {
        canManageAdmins: true,
        canViewAuditLog: true,
        canConfigurePlatform: true,
        canEditHero: true,
        canEditLegalPages: true,
        canManageJobPositions: true,
        canViewAllApplicants: true,
        canScreenApplicants: true,
        canAdvanceRejectApplicants: true,
        canEditScreeningQuestions: true,
        canAddNotes: true,
        canManageExams: true,
        canGradeExams: true,
        canScheduleInterviews: true,
        canConductInterviews: true,
        canSendEmails: true,
        canManageContracts: true,
        canSignContracts: false,
        canManageTraining: true,
        canAccessTraining: false,
        canExportData: true,
        canViewOwnApplication: false,
        canTakeExams: false,
        canViewOwnDashboard: true,
    },
    hr_admin: {
        canManageAdmins: false,
        canViewAuditLog: false,
        canConfigurePlatform: false,
        canEditHero: true,
        canEditLegalPages: true,
        canManageJobPositions: true,
        canViewAllApplicants: true,
        canScreenApplicants: true,
        canAdvanceRejectApplicants: true,
        canEditScreeningQuestions: true,
        canAddNotes: true,
        canManageExams: true,
        canGradeExams: true,
        canScheduleInterviews: true,
        canConductInterviews: true,
        canSendEmails: true,
        canManageContracts: true,
        canSignContracts: false,
        canManageTraining: true,
        canAccessTraining: false,
        canExportData: true,
        canViewOwnApplication: false,
        canTakeExams: false,
        canViewOwnDashboard: true,
    },
    screener: {
        canManageAdmins: false,
        canViewAuditLog: false,
        canConfigurePlatform: false,
        canEditHero: false,
        canEditLegalPages: false,
        canManageJobPositions: false,
        canViewAllApplicants: true,
        canScreenApplicants: true,
        canAdvanceRejectApplicants: false,
        canEditScreeningQuestions: true,
        canAddNotes: true,
        canManageExams: false,
        canGradeExams: false,
        canScheduleInterviews: false,
        canConductInterviews: false,
        canSendEmails: false,
        canManageContracts: false,
        canSignContracts: false,
        canManageTraining: false,
        canAccessTraining: false,
        canExportData: false,
        canViewOwnApplication: false,
        canTakeExams: false,
        canViewOwnDashboard: true,
    },
    agent: {
        canManageAdmins: false,
        canViewAuditLog: false,
        canConfigurePlatform: false,
        canEditHero: false,
        canEditLegalPages: false,
        canManageJobPositions: false,
        canViewAllApplicants: false,
        canScreenApplicants: false,
        canAdvanceRejectApplicants: false,
        canEditScreeningQuestions: false,
        canAddNotes: false,
        canManageExams: false,
        canGradeExams: false,
        canScheduleInterviews: false,
        canConductInterviews: false,
        canSendEmails: false,
        canManageContracts: false,
        canSignContracts: true,
        canManageTraining: false,
        canAccessTraining: true,
        canExportData: false,
        canViewOwnApplication: true,
        canTakeExams: false,
        canViewOwnDashboard: true,
    },
    applicant: {
        canManageAdmins: false,
        canViewAuditLog: false,
        canConfigurePlatform: false,
        canEditHero: false,
        canEditLegalPages: false,
        canManageJobPositions: false,
        canViewAllApplicants: false,
        canScreenApplicants: false,
        canAdvanceRejectApplicants: false,
        canEditScreeningQuestions: false,
        canAddNotes: false,
        canManageExams: false,
        canGradeExams: false,
        canScheduleInterviews: false,
        canConductInterviews: false,
        canSendEmails: false,
        canManageContracts: false,
        canSignContracts: false,
        canManageTraining: false,
        canAccessTraining: false,
        canExportData: false,
        canViewOwnApplication: true,
        canTakeExams: true,
        canViewOwnDashboard: true,
    },
};

/**
 * Get the full permission map for a given role.
 */
export function getPermissions(role: UserRole): PermissionMap {
    return PERMISSIONS[role] || PERMISSIONS.applicant;
}

/**
 * Check a single permission for a role.
 */
export function hasPermission(role: UserRole, permission: keyof PermissionMap): boolean {
    const perms = getPermissions(role);
    return perms[permission] ?? false;
}

/**
 * Check if a role is any kind of admin/staff.
 */
export function isStaffRole(role: UserRole): boolean {
    return ['super_admin', 'hr_admin', 'screener'].includes(role);
}

/**
 * Check if a role has full admin access (not screener).
 */
export function isAdminRole(role: UserRole): boolean {
    return ['super_admin', 'hr_admin'].includes(role);
}

/**
 * Get a human-readable label for a role.
 */
export function getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
        super_admin: 'Super Admin',
        hr_admin: 'HR Admin',
        screener: 'Screener',
        agent: 'Agent',
        applicant: 'Applicant',
    };
    return labels[role] || 'Unknown';
}

/**
 * Get a badge color class for a role.
 */
export function getRoleBadgeClass(role: UserRole): string {
    const classes: Record<UserRole, string> = {
        super_admin: 'bg-red-500/10 text-red-400 border-red-500/20',
        hr_admin: 'bg-accent/10 text-accent border-accent/20',
        screener: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        agent: 'bg-green-500/10 text-green-400 border-green-500/20',
        applicant: 'bg-white/5 text-white/60 border-white/10',
    };
    return classes[role] || classes.applicant;
}

/**
 * All pipeline stages in order.
 */
export const PIPELINE_STAGES = [
    'New',
    'Screening Review',
    'Qualified',
    'Disqualified',
    'Account Invited',
    'Exam Assigned',
    'Exam Completed',
    'Interview Scheduled',
    'Interview Completed',
    'Offer Extended',
    'Contract Sent',
    'Contract Signed',
    'Hired',
    'Rejected',
    'Withdrawn',
] as const;

export type PipelineStage = typeof PIPELINE_STAGES[number];

/**
 * Get a badge color class for a pipeline stage.
 */
export function getStageBadgeClass(stage: string): string {
    switch (stage) {
        case 'Hired':
        case 'Contract Signed':
            return 'bg-green-500/10 text-green-400 border-green-500/20';
        case 'Rejected':
        case 'Disqualified':
        case 'Withdrawn':
            return 'bg-red-500/10 text-red-400 border-red-500/20';
        case 'New':
        case 'Screening Review':
            return 'bg-accent/10 text-accent border-accent/20';
        case 'Qualified':
        case 'Account Invited':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        case 'Interview Scheduled':
        case 'Interview Completed':
            return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
        case 'Offer Extended':
        case 'Contract Sent':
            return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        default:
            return 'bg-white/5 text-white/60 border-white/10';
    }
}
