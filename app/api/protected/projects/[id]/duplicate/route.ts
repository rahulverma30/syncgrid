import { NextResponse } from 'next/server';
import { apiErrorResponse } from '@/lib/errors';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { Project } from '@/models/Project';
import { ProjectActivity } from '@/models/ProjectActivity';
import mongoose from 'mongoose';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const { id } = await context.params;
    const companyId = session.user.companyId;
    const userName = session.user.name;
    const body = await request.json();

    const originalProject = await Project.findOne({ _id: id, companyId });
    if (!originalProject) {
      return NextResponse.json(
        { success: false, error: 'NOT_FOUND', message: 'Original project not found.' },
        { status: 404 }
      );
    }

    const {
      name,
      duplicateMilestones,
      duplicateSprints,
      duplicateTeam,
      duplicateDocuments,
      duplicateRisks,
    } = body;

    // Deep clone helper that remaps _id values
    const cloneSubdocuments = (array: any[] = []) => {
      return array.map((item: any) => {
        const doc = item.toObject ? item.toObject() : { ...item };
        delete doc._id;
        doc._id = new mongoose.Types.ObjectId();
        return doc;
      });
    };

    const newProjectData: Record<string, any> = {
      companyId,
      name: name || `${originalProject.name} (Copy)`,
      description: originalProject.description,
      clientId: originalProject.clientId,
      leadId: originalProject.leadId,
      status: 'planning', // Reset to planning on duplication
      priority: originalProject.priority,
      projectManager: originalProject.projectManager,
      budget: originalProject.budget,
      billingType: originalProject.billingType,
      billingRate: originalProject.billingRate,
      estimatedHours: originalProject.estimatedHours,
      actualHours: 0, // Reset actual logged hours
      startDate: originalProject.startDate,
      deadline: originalProject.deadline,
      technologies: [...(originalProject.technologies || [])],
      repositoryLinks: [...(originalProject.repositoryLinks || [])],
      stagingUrl: originalProject.stagingUrl,
      liveUrl: originalProject.liveUrl,
      tags: [...(originalProject.tags || [])],
      customFields: originalProject.customFields
        ? new Map(originalProject.customFields)
        : new Map(),
      isArchived: false,
    };

    if (duplicateMilestones && originalProject.milestones) {
      newProjectData.milestones = cloneSubdocuments(originalProject.milestones);
    } else {
      newProjectData.milestones = [];
    }

    if (duplicateSprints && originalProject.sprints) {
      newProjectData.sprints = cloneSubdocuments(originalProject.sprints).map((s: any) => {
        s.status = 'planning'; // Reset sprints status on clone
        s.velocity = 0;
        return s;
      });
    } else {
      newProjectData.sprints = [];
    }

    if (duplicateTeam && originalProject.teamMembers) {
      newProjectData.teamMembers = cloneSubdocuments(originalProject.teamMembers);
    } else {
      newProjectData.teamMembers = [];
    }

    if (duplicateDocuments && originalProject.documents) {
      newProjectData.documents = cloneSubdocuments(originalProject.documents);
    } else {
      newProjectData.documents = [];
    }

    if (duplicateRisks && originalProject.risks) {
      newProjectData.risks = cloneSubdocuments(originalProject.risks).map((r: any) => {
        r.status = 'open'; // Reset risks status on clone
        return r;
      });
    } else {
      newProjectData.risks = [];
    }

    // Let pre-save hook generate fresh code and calculate health
    const newProject = new Project(newProjectData);
    await newProject.save();

    // Centralized Audit trail logging
    const activity = new ProjectActivity({
      companyId,
      projectId: newProject._id,
      type: 'project_duplicated',
      title: 'Project Duplicated',
      description: `New project "${newProject.name}" created by duplicating "${originalProject.name}" (Initiated by ${userName}).`,
      userName,
    });
    await activity.save();

    return NextResponse.json({ success: true, data: newProject }, { status: 201 });
  } catch (error: any) {
    return apiErrorResponse(error);
  }
});
