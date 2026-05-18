import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import { WikiSpace, KnowledgeCategory, Document, DocumentVersion, KnowledgeActivity } from '@/models';
import { logger } from '@/lib/logger';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;

    // 1. Check if spaces already exist to prevent duplicate seed overrides
    const count = await WikiSpace.countDocuments({ companyId });
    if (count > 0) {
      return NextResponse.json({ success: true, message: 'Sandbox data already populated' });
    }

    // 2. Create Knowledge Categories
    const catPlaybook = new KnowledgeCategory({ companyId, name: 'Playbooks', slug: 'playbooks', colorCode: '#10B981' });
    const catPolicy = new KnowledgeCategory({ companyId, name: 'Policies', slug: 'policies', colorCode: '#EF4444' });
    const catSop = new KnowledgeCategory({ companyId, name: 'SOP Manuals', slug: 'sops', colorCode: '#3B82F6' });

    await catPlaybook.save();
    await catPolicy.save();
    await catSop.save();

    // 3. Create Wiki Spaces
    const spaceSop = new WikiSpace({
      companyId,
      name: 'Agency Standard Operating Procedures (SOPs)',
      slug: 'agency-sops',
      icon: 'book-open',
      description: 'Standard client delivery guidelines, design standards, and operational flow structures.',
      visibility: 'internal',
    });

    const spaceOnboarding = new WikiSpace({
      companyId,
      name: 'Employee Onboarding Hub',
      slug: 'onboarding-hub',
      icon: 'user-plus',
      description: 'Runbooks, account creation checklists, and tool tutorials for new recruits.',
      visibility: 'internal',
    });

    const spacePolicy = new WikiSpace({
      companyId,
      name: 'Company Security & Policies',
      slug: 'company-policies',
      icon: 'shield-alert',
      description: 'Workplace compliance regulations, info-sec directives, and standard company policies.',
      visibility: 'internal',
    });

    await spaceSop.save();
    await spaceOnboarding.save();
    await spacePolicy.save();

    // 4. Create Standard SOP and Policy Documents
    const docSop = new Document({
      companyId,
      spaceId: spaceSop._id,
      categoryId: catSop._id,
      ownerId: userId,
      title: 'Client Onboarding SOP Checklist',
      slug: 'client-onboarding-sop',
      icon: 'check-square',
      isSop: true,
      content: `<h2>Client Onboarding Operations Blueprint</h2>
<p>This standard operating procedure outlines the mandatory checkpoints required to fully ingest new corporate clients into our agency systems.</p>
<div class="p-4 border-l-4 border-blue-500 bg-slate-950/40 my-4 rounded">
  <strong>IMPORTANT Compliance Note:</strong> Every employee onboarding a client MUST complete this reading list and mark this page as "Read Acknowledged".
</div>
<ul>
  <li>✅ <strong>Step 1:</strong> Send welcoming onboarding questionnaire and request brand books.</li>
  <li>✅ <strong>Step 2:</strong> Provision client folder inside storage bucket scopes.</li>
  <li>✅ <strong>Step 3:</strong> Schedule the kickoff alignment sync board call.</li>
  <li>✅ <strong>Step 4:</strong> Invite client key collaborators to their dedicated workspace direct chat channels.</li>
</ul>`,
    });

    const docPolicy = new Document({
      companyId,
      spaceId: spacePolicy._id,
      categoryId: catPolicy._id,
      ownerId: userId,
      title: 'Workspace Information Security Access Policy',
      slug: 'security-access-policy',
      icon: 'shield-alert',
      isSop: true,
      content: `<h2>Info-Sec & Multi-Factor Access Directives</h2>
<p>To secure corporate tenant client databases, all contractors and employees must adhere to our access controls guidelines.</p>
<div class="p-4 border-l-4 border-red-500 bg-slate-950/40 my-4 rounded">
  <strong>CRITICAL WARNING:</strong> Failure to configure password tokens within 48 hours will lock the account.
</div>
<ol>
  <li>🔒 Configure Multi-Factor Authentication (MFA) on all active developer accounts.</li>
  <li>🔒 Never share API access keys or storage tokens inside public chat environments.</li>
  <li>🔒 Reset temporary passwords immediately after account ingestion.</li>
</ol>`,
    });

    const docGuide = new Document({
      companyId,
      spaceId: spaceOnboarding._id,
      categoryId: catPlaybook._id,
      ownerId: userId,
      title: 'New Recruits Setup Checklist',
      slug: 'new-hire-setup',
      icon: 'user-plus',
      isSop: false,
      content: `<h2>Welcome to the Team! Let's get you set up.</h2>
<p>Follow these steps in your first 3 days to ingestion successfully:</p>
<ul>
  <li>📋 Set up your employee profile details under the HR module settings page.</li>
  <li>📋 Connect your email to receive invoice approvals alerts.</li>
  <li>📋 Join the central #general and #onboarding collaboration chat rooms.</li>
</ul>`,
    });

    await docSop.save();
    await docPolicy.save();
    await docGuide.save();

    // Create Initial Version checkmarks
    await new DocumentVersion({ documentId: docSop._id, editorId: userId, title: docSop.title, content: docSop.content, changeSummary: 'System Initial Seed', versionNumber: 1 }).save();
    await new DocumentVersion({ documentId: docPolicy._id, editorId: userId, title: docPolicy.title, content: docPolicy.content, changeSummary: 'System Initial Seed', versionNumber: 1 }).save();
    await new DocumentVersion({ documentId: docGuide._id, editorId: userId, title: docGuide.title, content: docGuide.content, changeSummary: 'System Initial Seed', versionNumber: 1 }).save();

    // Add activity records
    await new KnowledgeActivity({ companyId, userId, spaceId: spaceSop._id, action: 'space_created', details: 'Seeded Workspace SOP space' }).save();
    await new KnowledgeActivity({ companyId, userId, spaceId: spaceOnboarding._id, action: 'space_created', details: 'Seeded Workplace onboarding hub' }).save();
    await new KnowledgeActivity({ companyId, userId, spaceId: spacePolicy._id, action: 'space_created', details: 'Seeded Corporate compliance hub' }).save();

    logger.info('[Knowledge Seed] Successfully populated sandbox mock documents.', { companyId });

    return NextResponse.json({ success: true, message: 'Sandbox data successfully seeded' });
  } catch (error: any) {
    logger.error('Failed to seed sandbox data:', error, { companyId: session?.user?.companyId });
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
