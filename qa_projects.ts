import mongoose from 'mongoose';
import { Project } from './models/Project';
import { AttendanceLog } from './models/AttendanceLog';
import { ProjectActivity } from './models/ProjectActivity';
import { connectToDatabase } from './lib/db/mongodb';

async function runTest() {
  await connectToDatabase();
  const companyId = new mongoose.Types.ObjectId();
  const userId = new mongoose.Types.ObjectId();

  // Create Project
  const project = await Project.create({
    companyId,
    name: 'QA Certification Project',
    code: 'QA-01',
    description: 'Test project',
    status: 'planning',
    billingType: 'fixed',
    budget: 10000,
    estimatedHours: 40,
    actualHours: 0,
  });

  // Create AttendanceLog simulating Punch in and out manually to see if our route's logic was right
  // We can't hit the route directly easily from here, but we can verify our models support it.

  const docUploadAct = await ProjectActivity.create({
    companyId,
    projectId: project._id,
    type: 'document_uploaded',
    title: 'Doc uploaded',
    userName: 'Tester',
  });

  console.log('Project created:', !!project);
  console.log('Project Activity created:', !!docUploadAct);

  await mongoose.disconnect();
}

runTest().catch(console.error);
