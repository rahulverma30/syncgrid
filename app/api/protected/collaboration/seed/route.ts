import { NextResponse } from 'next/server';
import { withApiAuth } from '@/lib/auth/api';
import { connectToDatabase } from '@/lib/db/mongodb';
import {
  Workspace,
  Channel,
  Conversation,
  Message,
  Thread,
  Reaction,
  Announcement,
  SharedNote,
  User,
  PresenceSession,
} from '@/models';

export const POST = withApiAuth(async (request: Request, context: any, session: any) => {
  try {
    await connectToDatabase();
    const companyId = session.user.companyId;
    const userId = session.user.id;
    const userName = session.user.name;

    // 1. Clean existing records for this tenant
    await Workspace.deleteMany({ companyId });
    await Channel.deleteMany({ companyId });
    await Conversation.deleteMany({ companyId });
    await Message.deleteMany({ companyId });
    await Thread.deleteMany({ companyId });
    await Reaction.deleteMany({ companyId });
    await Announcement.deleteMany({ companyId });
    await SharedNote.deleteMany({ companyId });

    // 2. Query available users for mock Direct Messages
    const companyUsers = await User.find({ companyId }).limit(5).lean();

    // Fallback list if only current user is seeded
    const usersList =
      companyUsers.length > 0
        ? companyUsers
        : [{ _id: userId, name: userName, email: session.user.email }];
    const firstOtherUser = usersList.find((u) => u._id.toString() !== userId) || usersList[0];

    // 3. Create Default Workspace
    const defaultWorkspace = new Workspace({
      companyId,
      name: 'SyncGrid HQ Office',
      description: 'Central operations, communication, and project collaboration workspace.',
      members: usersList.map((u) => ({
        userId: u._id,
        role: u._id.toString() === userId ? 'admin' : 'member',
      })),
    });
    await defaultWorkspace.save();

    // 4. Create Standard Channels
    const channelsData = [
      {
        companyId,
        workspaceId: defaultWorkspace._id,
        name: 'general',
        type: 'public',
        description: 'Company-wide general discussions, watercooler chat, and daily updates.',
        isArchived: false,
      },
      {
        companyId,
        workspaceId: defaultWorkspace._id,
        name: 'announcements',
        type: 'public',
        description: 'Corporate alerts, updates, holiday posts, and major milestone celebrations.',
        isArchived: false,
      },
      {
        companyId,
        workspaceId: defaultWorkspace._id,
        name: 'development',
        type: 'project',
        description: 'Engineering coordination, release schedules, and PR reviews discussion.',
        isArchived: false,
      },
      {
        companyId,
        workspaceId: defaultWorkspace._id,
        name: 'hr-benefits',
        type: 'department',
        description: 'HR policies updates, leaves inquiries, and benefits enrollment guidelines.',
        isArchived: false,
      },
    ];

    const seededChannels = await Channel.insertMany(channelsData);

    // 5. Create direct message conversations
    const seededDms = [];
    if (firstOtherUser && firstOtherUser._id.toString() !== userId) {
      const dm = new Conversation({
        companyId,
        participants: [userId, firstOtherUser._id],
        isGroup: false,
      });
      await dm.save();
      seededDms.push(dm);
    }

    // 6. Seed Channel Messages (General Channel)
    const generalChannel = seededChannels[0];
    const generalMessages = [
      {
        companyId,
        senderId: firstOtherUser._id,
        channelId: generalChannel._id,
        contentType: 'text',
        content:
          'Good morning team! Hope everyone had a great weekend. Are we ready for the Q2 product sprint reviews today?',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4h ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4),
      },
      {
        companyId,
        senderId: userId,
        channelId: generalChannel._id,
        contentType: 'text',
        content:
          'Morning! Yes, slide decks are finished and the staging dashboard builds are fully compiled. Let us meet in the engineering room at 10 AM.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3h ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
      },
      {
        companyId,
        senderId: firstOtherUser._id,
        channelId: generalChannel._id,
        contentType: 'text',
        content:
          'Excellent. I will invite the account managers so they can get an early preview of the custom reports feature.',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2h ago
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
      },
    ];

    const seededMessages = await Message.insertMany(generalMessages);

    // 7. Seed thread discussion (Reply to second message)
    const threadMessage = seededMessages[1];
    const thread = new Thread({
      companyId,
      parentMessageId: threadMessage._id,
      replies: [
        {
          senderId: firstOtherUser._id,
          content:
            'I reviewed the charts layout on mobile, fits perfectly! The Outfit font styling feels extremely premium.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.5),
        },
        {
          senderId: userId,
          content:
            'Appreciate the feedback! I added a subtle slide-in animation to make tab changes feel smoother.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2.2),
        },
      ],
      participants: [userId, firstOtherUser._id],
    });
    await thread.save();

    // Update parent message reply count
    threadMessage.replyCount = 2;
    await threadMessage.save();

    // 8. Seed reactions on messages
    const reactions = [
      {
        companyId,
        messageId: seededMessages[0]._id,
        userId: userId,
        emoji: '👍',
      },
      {
        companyId,
        messageId: seededMessages[0]._id,
        userId: firstOtherUser._id,
        emoji: '🔥',
      },
      {
        companyId,
        messageId: threadMessage._id,
        userId: firstOtherUser._id,
        emoji: '🎉',
      },
    ];
    await Reaction.insertMany(reactions);

    // 9. Seed Corporate Announcements
    const announcement = new Announcement({
      companyId,
      title: 'Company-Wide Q2 Performance Review Celebrations 🏆',
      content:
        'We are proud to announce that the Agency has exceeded its development goals for the quarter by 14%! Thanks to everyone for their hard work and dedication. Join us for a celebratory team lunch this Friday!',
      authorId: userId,
      acknowledgedBy: [firstOtherUser._id],
    });
    await announcement.save();

    // 10. Seed Shared Workspace Notes
    const note = new SharedNote({
      companyId,
      workspaceId: defaultWorkspace._id,
      title: 'Q2 Development Milestone Objectives Checklist',
      content: `### Sprint Objectives
- [x] Complete Module 12 Automation Engines audits
- [x] Release Module 13 Enterprise Collaboration Channels
- [ ] Connect CRM won deals hooks into automation pipelines
- [ ] Schedule staging end-to-end performance tests

### Operational Resources
- Dev server gateway: \`https://dev.syncgrid.io\`
- Staging logs trace: \`https://logs.syncgrid.io/alpha\``,
      updatedBy: userId,
      isPinned: true,
    });
    await note.save();

    // 11. Seed Presence Sessions
    await PresenceSession.findOneAndUpdate(
      { companyId, userId },
      { status: 'online', lastActiveAt: new Date() },
      { upsert: true }
    );
    if (firstOtherUser && firstOtherUser._id.toString() !== userId) {
      await PresenceSession.findOneAndUpdate(
        { companyId, userId: firstOtherUser._id },
        { status: 'online', lastActiveAt: new Date() },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Module 13 Collaboration sandbox environment seeded successfully!',
      data: {
        workspaceId: defaultWorkspace._id,
        channels: seededChannels,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
});
