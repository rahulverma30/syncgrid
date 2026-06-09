import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Employee, EmployeeActivity, Department } from '@/models';

// Import Mongoose models dynamically to prevent circular dependencies in Next.js edge builds
import mongoose from 'mongoose';

export const GET = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // Resolve current employee
    let emp = await Employee.findOne({ companyId, userId })
      .populate({ path: 'departmentId', select: 'name code managerId' })
      .populate({ path: 'teamId', select: 'name leaderId' })
      .populate({ path: 'managerId', select: 'name email' });

    if (!emp) {
      // Fallback matching email
      emp = await Employee.findOne({ companyId, email: session.user.email })
        .populate({ path: 'departmentId', select: 'name code managerId' })
        .populate({ path: 'teamId', select: 'name leaderId' })
        .populate({ path: 'managerId', select: 'name email' });

      if (emp) {
        emp.userId = userId;
        await emp.save();
      } else {
        // Safe auto-creation of employee profile for the active session context
        emp = new Employee({
          companyId,
          userId,
          fullName: session.user.name || 'System Administrator',
          email: session.user.email,
          status: 'active',
          designation: 'Principal Architect',
          joiningDate: new Date(),
          workMode: 'hybrid',
          timezone: 'UTC',
          skills: [
            { name: 'SaaS Architecture', proficiency: 5 },
            { name: 'TypeScript & Next.js', proficiency: 5 },
          ],
        });
        await emp.save();
      }
    }

    const obj = emp.toObject();

    // 1. Calculate Payroll Completeness Score
    let score = 0;
    const checks: Record<string, boolean> = {
      bankRouting: !!emp.payrollMetadata?.bankRouting,
      bankAccount: !!emp.payrollMetadata?.bankAccount,
      taxFormW4Signed: !!emp.payrollMetadata?.taxFormW4Signed,
      taxFormW9Signed: !!emp.payrollMetadata?.taxFormW9Signed,
      govIdVerified: !!emp.payrollMetadata?.govIdVerified,
    };

    if (checks.bankRouting && checks.bankAccount) score += 40; // Bank account ready
    if (checks.taxFormW4Signed || checks.taxFormW9Signed) score += 30; // Tax documents
    if (checks.govIdVerified) score += 20; // Verified ID
    if (emp.phone && emp.emergencyContacts?.length > 0) score += 10; // Profile compliance

    obj.payrollReadiness = {
      score,
      checks,
      status: score >= 90 ? 'compliant' : score >= 50 ? 'incomplete' : 'critical',
    };

    // 2. Resolve Assigned Projects from database
    const ProjectModel =
      mongoose.models.Project || mongoose.model('Project', new mongoose.Schema({}));
    const projects = await ProjectModel.find({
      companyId,
      isSoftDeleted: false,
      'teamMembers.userName': emp.fullName,
    })
      .select('name code budget timeline teamMembers status')
      .lean();

    obj.assignedProjects = projects.map((p: any) => {
      const member = p.teamMembers.find((m: any) => m.userName === emp.fullName);
      return {
        _id: p._id,
        name: p.name,
        code: p.code,
        status: p.status,
        allocation: member?.allocation || 100,
        role: member?.role || 'Contributor',
      };
    });

    // 3. Resolve Assigned Tasks
    const TaskModel = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({}));
    const tasks = await TaskModel.find({
      companyId,
      isSoftDeleted: false,
      assigneeId: userId,
    })
      .select('title code status priority stage dueDate estimatedHours')
      .lean();

    obj.assignedTasks = tasks;

    // 4. Resolve Employee specific activities
    const activities = await EmployeeActivity.find({
      companyId,
      employeeId: emp._id,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    obj.activities = activities;

    return NextResponse.json({ success: true, data: obj });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});

export const PUT = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    const emp = await Employee.findOne({ companyId, userId });
    if (!emp) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Employee profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();

    // Field lock validations: standard users can ONLY update their self-service fields
    const allowedFields = [
      'phone',
      'displayName',
      'timezone',
      'skills',
      'certifications',
      'emergencyContacts',
      'payrollMetadata',
      'presenceStatus',
    ];

    // Filter updates
    const updates: Record<string, any> = {};
    for (const key of allowedFields) {
      if (body[key] !== undefined) {
        // Special deep merging for payrollMetadata
        if (key === 'payrollMetadata') {
          updates.payrollMetadata = {
            ...emp.payrollMetadata,
            ...body.payrollMetadata,
          };
        } else {
          updates[key] = body[key];
        }
      }
    }

    // Update presence timestamp
    if (body.presenceStatus) {
      updates.lastActiveAt = new Date();
    }

    // Perform updates
    await Employee.findByIdAndUpdate(emp._id, { $set: updates });

    // Log Activity
    if (updates.phone || updates.emergencyContacts) {
      const activity = new EmployeeActivity({
        companyId,
        employeeId: emp._id,
        userId,
        type: 'promoted',
        title: 'Profile Updated',
        description: `${emp.fullName} updated their self-service employee profile fields.`,
      });
      await activity.save();
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
