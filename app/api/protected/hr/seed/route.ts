import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  Department,
  Team,
  Employee,
  AttendanceLog,
  LeaveRequest,
  EmployeePerformanceReview,
  EmployeeAnnouncement,
  EmployeeActivity,
} from '@/models';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // 1. Seed Departments
    let engDept = await Department.findOne({ companyId, code: 'ENG', isSoftDeleted: false });
    if (!engDept) {
      engDept = new Department({
        companyId,
        name: 'Engineering',
        code: 'ENG',
        managerId: userId,
        description: 'Agency software delivery and technical development department.',
      });
      await engDept.save();
    }

    let opsDept = await Department.findOne({ companyId, code: 'OPS', isSoftDeleted: false });
    if (!opsDept) {
      opsDept = new Department({
        companyId,
        name: 'Operations & HR',
        code: 'OPS',
        managerId: userId,
        description: 'Workforce operations, hiring, business management and company pipelines.',
      });
      await opsDept.save();
    }

    // 2. Seed Teams
    let engTeam = await Team.findOne({
      companyId,
      departmentId: engDept._id,
      name: 'Frontend Crew',
    });
    if (!engTeam) {
      engTeam = new Team({
        companyId,
        departmentId: engDept._id,
        name: 'Frontend Crew',
        leaderId: userId,
        description: 'UI excellence, responsive designs, and client satisfaction builders.',
      });
      await engTeam.save();
    }

    // 3. Clear existing HR data to avoid seeding explosion
    await Employee.deleteMany({ companyId });
    await AttendanceLog.deleteMany({ companyId });
    await LeaveRequest.deleteMany({ companyId });
    await EmployeePerformanceReview.deleteMany({ companyId });
    await EmployeeAnnouncement.deleteMany({ companyId });
    await EmployeeActivity.deleteMany({ companyId });

    // 4. Seed Employees
    const empData = [
      {
        fullName: 'Sarah Jenkins',
        displayName: 'Sarah (Frontend Tech)',
        email: 'sarah.j@syncgrid-agency.com',
        phone: '+1 (555) 234-9876',
        designation: 'Senior Frontend Architect',
        employmentType: 'full-time',
        joiningDate: new Date('2024-03-12'),
        workMode: 'hybrid',
        timezone: 'EST',
        status: 'active',
        skills: [
          { name: 'React Native', proficiency: 5 },
          { name: 'TypeScript', proficiency: 5 },
          { name: 'Next.js UI', proficiency: 4 },
        ],
        certifications: [
          {
            name: 'AWS Cloud Practitioner',
            issuer: 'Amazon Web Services',
            date: new Date('2025-01-10'),
          },
        ],
        emergencyContacts: [
          { name: 'Arthur Jenkins', relation: 'Spouse', phone: '+1 (555) 234-9800' },
        ],
        compensationMetadata: { salary: 9800, currency: 'USD', payPeriod: 'monthly' },
        attendanceSummary: { presentCount: 42, lateCount: 1, hoursTracked: 336 },
        leaveBalances: { casualDays: 10, sickDays: 8, paidDays: 12 },
        departmentId: engDept._id,
        teamId: engTeam._id,
      },
      {
        fullName: 'David Miller',
        displayName: 'David Miller',
        email: 'david.m@syncgrid-agency.com',
        phone: '+1 (555) 890-5432',
        designation: 'Product Experience Designer',
        employmentType: 'full-time',
        joiningDate: new Date('2026-02-01'),
        workMode: 'remote',
        timezone: 'EST',
        status: 'onboarding',
        skills: [
          { name: 'Figma Prototyping', proficiency: 5 },
          { name: 'User Experience', proficiency: 4 },
          { name: 'Wireframing', proficiency: 4 },
        ],
        certifications: [],
        emergencyContacts: [
          { name: 'Janet Miller', relation: 'Mother', phone: '+1 (555) 890-5400' },
        ],
        compensationMetadata: { salary: 7200, currency: 'USD', payPeriod: 'monthly' },
        attendanceSummary: { presentCount: 10, lateCount: 0, hoursTracked: 80 },
        leaveBalances: { casualDays: 12, sickDays: 10, paidDays: 15 },
        departmentId: opsDept._id,
      },
      {
        fullName: 'Michael Chang',
        displayName: 'Michael Chang',
        email: 'michael.c@syncgrid-agency.com',
        phone: '+1 (555) 456-7890',
        designation: 'Staff Backend Architect',
        employmentType: 'full-time',
        joiningDate: new Date('2023-08-15'),
        workMode: 'office',
        timezone: 'UTC',
        status: 'active',
        skills: [
          { name: 'MongoDB Indexing', proficiency: 5 },
          { name: 'Distributed Go Systems', proficiency: 5 },
          { name: 'Docker Cluster', proficiency: 4 },
        ],
        certifications: [
          {
            name: 'Mongoose Expert Certified',
            issuer: 'MongoDB Academy',
            date: new Date('2024-06-15'),
          },
        ],
        emergencyContacts: [
          { name: 'Jenny Chang', relation: 'Sister', phone: '+1 (555) 456-7800' },
        ],
        compensationMetadata: { salary: 11500, currency: 'USD', payPeriod: 'monthly' },
        attendanceSummary: { presentCount: 88, lateCount: 4, hoursTracked: 704 },
        leaveBalances: { casualDays: 6, sickDays: 9, paidDays: 5 },
        departmentId: engDept._id,
      },
      {
        fullName: 'Emily Watson',
        displayName: 'Emily (Operations)',
        email: 'emily.w@syncgrid-agency.com',
        phone: '+1 (555) 765-4321',
        designation: 'Operations Specialist',
        employmentType: 'full-time',
        joiningDate: new Date('2025-01-05'),
        workMode: 'hybrid',
        timezone: 'EST',
        status: 'active',
        skills: [
          { name: 'Strategic Recruiting', proficiency: 4 },
          { name: 'Gusto Management', proficiency: 4 },
          { name: 'BambooHR Automation', proficiency: 5 },
        ],
        certifications: [],
        emergencyContacts: [
          { name: 'George Watson', relation: 'Father', phone: '+1 (555) 765-4300' },
        ],
        compensationMetadata: { salary: 6500, currency: 'USD', payPeriod: 'monthly' },
        attendanceSummary: { presentCount: 30, lateCount: 0, hoursTracked: 240 },
        leaveBalances: { casualDays: 9, sickDays: 7, paidDays: 14 },
        departmentId: opsDept._id,
      },
      {
        fullName: 'Robert Dow',
        displayName: 'Robert Dow',
        email: 'robert.d@syncgrid-agency.com',
        phone: '+1 (555) 908-1122',
        designation: 'Contract Dev Specialist',
        employmentType: 'contractor',
        joiningDate: new Date('2025-09-01'),
        workMode: 'remote',
        timezone: 'PST',
        status: 'suspended',
        skills: [
          { name: 'Python ETL pipelines', proficiency: 4 },
          { name: 'C++ Networking', proficiency: 4 },
        ],
        certifications: [],
        emergencyContacts: [{ name: 'Mary Dow', relation: 'Wife', phone: '+1 (555) 908-1100' }],
        compensationMetadata: { salary: 4500, currency: 'USD', payPeriod: 'monthly' },
        attendanceSummary: { presentCount: 15, lateCount: 2, hoursTracked: 120 },
        leaveBalances: { casualDays: 4, sickDays: 10, paidDays: 0 },
        departmentId: engDept._id,
      },
    ];

    const seededEmployees = [];
    for (const data of empData) {
      const emp = new Employee({
        companyId,
        ...data,
      });
      await emp.save();
      seededEmployees.push(emp);

      // Log activity
      const activity = new EmployeeActivity({
        companyId,
        employeeId: emp._id,
        userId,
        type: 'hired',
        title: 'Employee Seeded',
        description: `${emp.fullName} was enrolled as ${emp.designation} by seeder.`,
        metadata: { seederRun: true },
      });
      await activity.save();
    }

    const sarah = seededEmployees[0];
    const david = seededEmployees[1];
    const emily = seededEmployees[3];

    // 5. Seed Attendance Logs (last 5 days punches for Sarah Jenkins)
    const modes: ('remote' | 'hybrid' | 'office')[] = [
      'remote',
      'hybrid',
      'hybrid',
      'remote',
      'office',
    ];
    for (let i = 0; i < 5; i++) {
      const punchDate = new Date();
      punchDate.setUTCDate(punchDate.getUTCDate() - i);
      const checkInTime = new Date(punchDate.setUTCHours(8, 30, 0, 0));
      const checkOutTime = new Date(punchDate.setUTCHours(17, 0, 0, 0));

      const log = new AttendanceLog({
        companyId,
        employeeId: sarah._id,
        date: punchDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workMode: modes[i],
        status: 'present',
        overtimeMinutes: 30, // 30 minutes overtime
        notes: 'Daily project scrum completed.',
      });
      await log.save();
    }

    // 6. Seed Leave Requests
    // Emily Watson: Approved sick leave
    const sickLeave = new LeaveRequest({
      companyId,
      employeeId: emily._id,
      leaveType: 'sick',
      startDate: new Date('2026-05-10'),
      endDate: new Date('2026-05-12'),
      totalDays: 3,
      reason: 'Suffering from seasonal flu.',
      status: 'approved',
      approvedBy: userId,
      approvedAt: new Date(),
      managerNotes: 'Get well soon!',
    });
    await sickLeave.save();

    // David Miller: Pending casual leave
    const casualLeave = new LeaveRequest({
      companyId,
      employeeId: david._id,
      leaveType: 'casual',
      startDate: new Date('2026-05-24'),
      endDate: new Date('2026-05-25'),
      totalDays: 2,
      reason: 'Moving to new apartment.',
      status: 'pending',
    });
    await casualLeave.save();

    // 7. Seed Performance Review (for Sarah Jenkins)
    const review = new EmployeePerformanceReview({
      companyId,
      employeeId: sarah._id,
      reviewerId: userId,
      cycleName: '2026 Annual Performance Cycle',
      reviewDate: new Date(),
      score: 5,
      selfFeedback: 'I feel I met all sprint deadlines and achieved top UI performance rates.',
      managerFeedback:
        'Sarah has done a marvelous job designing accessible workspaces and virtualizing heavy lists.',
      goals: [
        { title: 'Virtualize Kanban Columns', status: 'achieved', kpi: '60fps rendering' },
        {
          title: 'Enforce RBAC Security Policies',
          status: 'in_progress',
          kpi: 'Field-level API restrictions',
        },
      ],
    });
    await review.save();

    sarah.performanceMetadata.lastReviewScore = 5;
    sarah.performanceMetadata.activeGoalsCount = 1;
    await sarah.save();

    // 8. Seed Company Announcement
    const announcement = new EmployeeAnnouncement({
      companyId,
      title: 'Module 9 Launch & Onboarding Protocols',
      content:
        'Welcome to the complete SyncGrid Workforce Operations Dashboard! You can now manage company departments, clock check-ins, request leave times, and review performance goals smoothly. Please check your profile, verify details, and complete your onboarding checklist.',
      postedBy: userId,
      isPinned: true,
    });
    await announcement.save();

    return NextResponse.json({
      success: true,
      message: 'HR Demo Dataset seeded successfully!',
      data: {
        departments: 2,
        teams: 1,
        employees: seededEmployees.length,
        attendanceLogs: 5,
        leaveRequests: 2,
        reviews: 1,
        announcements: 1,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'SEED_ERROR', message: error.message },
      { status: 500 }
    );
  }
});
