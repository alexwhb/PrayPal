import { faker } from '@faker-js/faker'
import {
	$Enums,
	CategoryType,
	ContentStatus,
	GroupFrequency,
	MembershipStatus,
	RequestType,
	ShareType,
} from '@prisma/client'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import { createPassword, createUser, getUserImages } from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'
import GroupRole = $Enums.GroupRole

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	const totalUsers = 5
	console.time(`👤 Created ${totalUsers} users...`)
	const userImages = await getUserImages()

	await prisma.role.createMany({
		data: [
			{ name: 'user', description: 'Regular user role' },
			{ name: 'admin', description: 'Administrator role' },
			{ name: 'moderator', description: 'Moderator role' },
		],
	})

	// Categories for all types
	const categories = {
		prayer: [
			'Spiritual Growth',
			'Health & Healing',
			'Family & Relationships',
			'Work & Career',
			'Guidance & Direction',
			'Emotional Support',
			'Financial Breakthrough',
			'Education',
		],
		need: [
			'Food & Groceries',
			'Housing & Shelter',
			'Transportation',
			'Medical & Healthcare',
			'Education & Training',
			'Clothing',
			'Financial Assistance',
			'Home Repairs',
		],
		share: [
			'Power Tools',
			'Yard Equipment',
			'Kitchen Appliances',
			'Sports Equipment',
			'Books',
			'Electronics',
			'Furniture',
			'Other',
		],
		group: [
			'Bible Study',
			'Prayer',
			'Outreach',
			'Support',
			'Activity',
			'Book Club',
			'Worship',
			'Other',
		],
	}

	// Create all categories
	await prisma.category.createMany({
		data: [
			...categories.prayer.map((name) => ({
				type: CategoryType.PRAYER,
				name,
				active: true,
			})),
			...categories.need.map((name) => ({
				type: CategoryType.NEED,
				name,
				active: true,
			})),
			...categories.share.map((name) => ({
				type: CategoryType.SHARE,
				name,
				active: true,
			})),
			...categories.group.map((name) => ({
				type: CategoryType.GROUP,
				name,
				active: true,
			})),
		],
	})

	// Fetch created categories for reference
	const prayerCategoryRecords = await prisma.category.findMany({
		where: { type: CategoryType.PRAYER, active: true },
	})

	const needCategoryRecords = await prisma.category.findMany({
		where: { type: CategoryType.NEED, active: true },
	})

	const shareCategoryRecords = await prisma.category.findMany({
		where: { type: CategoryType.SHARE, active: true },
	})

	// Update user creation to include requests
	const userIds = []
	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const user = await prisma.user.create({
			data: {
				...userData,
				password: { create: createPassword(userData.username) },
				roles: { connect: { name: 'user' } },
				requests: {
					createMany: {
						data: [
							// Create some prayer requests
							...Array.from({
								length: faker.number.int({ min: 5, max: 20 }),
							}).map(() => {
								const fulfilled = faker.datatype.boolean()
								return {
									type: RequestType.PRAYER,
									categoryId: faker.helpers.arrayElement(prayerCategoryRecords)
										.id,
									description: faker.lorem.paragraph(),
									fulfilled: fulfilled,
									status: faker.helpers.arrayElement([
										ContentStatus.ACTIVE,
										ContentStatus.PENDING,
									]),

									response: fulfilled
										? {
												message: faker.lorem.sentence(),
												prayerCount: faker.number.int({ min: 0, max: 3 }),
											}
										: null,
								}
							}),
							// Create some need requests
							...Array.from({
								length: faker.number.int({ min: 5, max: 15 }),
							}).map(() => ({
								type: RequestType.NEED,
								categoryId: faker.helpers.arrayElement(needCategoryRecords).id,
								description: faker.lorem.paragraph(),
								fulfilled: faker.datatype.boolean(),
								fulfilledAt: faker.datatype.boolean()
									? faker.date.past()
									: null,
								fulfilledBy: faker.datatype.boolean()
									? faker.string.uuid()
									: null,
								status: faker.helpers.arrayElement([
									ContentStatus.ACTIVE,
									ContentStatus.PENDING,
								]),

								response: null,
							})),
						],
					},
				},
			},
		})

		// Upload user profile image
		const userImage = userImages[index % userImages.length]
		if (userImage) {
			await prisma.userImage.create({
				data: {
					userId: user.id,
					objectKey: userImage.objectKey,
				},
			})
		}

		userIds.push(user.id) // Store user IDs for later use
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created admin user "kody"`)

	const kodyImages = {
		kodyUser: { objectKey: 'user/kody.png' },
		cuteKoala: {
			altText: 'an adorable koala cartoon illustration',
			objectKey: 'kody-notes/cute-koala.png',
		},
		koalaEating: {
			altText: 'a cartoon illustration of a koala in a tree eating',
			objectKey: 'kody-notes/koala-eating.png',
		},
		koalaCuddle: {
			altText: 'a cartoon illustration of koalas cuddling',
			objectKey: 'kody-notes/koala-cuddle.png',
		},
		mountain: {
			altText: 'a beautiful mountain covered in snow',
			objectKey: 'kody-notes/mountain.png',
		},
		koalaCoder: {
			altText: 'a koala coding at the computer',
			objectKey: 'kody-notes/koala-coder.png',
		},
		koalaMentor: {
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			objectKey: 'kody-notes/koala-mentor.png',
		},
		koalaSoccer: {
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			objectKey: 'kody-notes/koala-soccer.png',
		},
	}

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	const kody = await prisma.user.create({
		select: { id: true },
		data: {
			email: 'kody@kcd.dev',
			username: 'kody',
			name: 'Kody',

			password: { create: createPassword('kodylovesyou') },
			connections: {
				create: { providerName: 'github', providerId: githubUser.profile.id },
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	})

	await prisma.userImage.create({
		data: {
			userId: kody.id,
			objectKey: kodyImages.kodyUser.objectKey,
		},
	})


	const other = await prisma.user.create({
		select: { id: true },
		data: {
			email: 'test@kcd.dev',
			username: 'mody',
			name: 'Mody',

			password: { create: createPassword('testlovesyou') },
			// connections: {
			// 	create: { providerName: 'github', providerId: githubUser.profile.id },
			// },
			roles: { connect: [{ name: 'user' }] },
		},
	})

	await prisma.userImage.create({
		data: {
			userId: other.id,
			objectKey: kodyImages.cuteKoala.objectKey,
		},
	})


	userIds.push(kody.id) // Add Kody to the user list
	userIds.push(other.id) // Add Mody to the user list

	console.timeEnd(`🐨 Created admin user "kody"`)

	// Seed groups
	console.time(`👥 Creating groups...`)
	const groupCategoryRecords = await prisma.category.findMany({
		where: { type: CategoryType.GROUP, active: true },
	})

	const groups = []

	// Create 10 groups
	for (let i = 0; i < 10; i++) {
		const meetingTime = faker.date.future()
		const isOnline = faker.datatype.boolean()

		groups.push({
			name: faker.helpers.arrayElement([
				'Sunday Morning Bible Study',
				'Youth Prayer Warriors',
				"Women's Fellowship",
				"Men's Breakfast Group",
				'Marriage Enrichment',
				'College & Career',
				'Senior Saints',
				'Young Adults',
				'Worship Team Practice',
				'Community Outreach Team',
				'Financial Peace Group',
				'Grief Support Circle',
			]),
			description: faker.lorem.paragraph(),
			frequency: faker.helpers.arrayElement(Object.values(GroupFrequency)),
			meetingTime,
			location: isOnline ? null : faker.location.streetAddress(),
			isOnline,
			isPrivate: faker.datatype.boolean({ probability: 0.7 }), // 70% chance of being private
			active: faker.datatype.boolean({ probability: 0.9 }), // 90% chance of being active
			categoryId: faker.helpers.arrayElement(groupCategoryRecords).id,
		})
	}

	const createdGroups = await Promise.all(
		groups.map((group) =>
			prisma.group.create({
				data: group,
			}),
		),
	)
	console.timeEnd(`👥 Created groups...`)

	// Seed group memberships
	console.time(`🤝 Creating group memberships...`)
	const memberships = []

	for (const group of createdGroups) {
		// Always create exactly one leader for each group initially
		const initialLeader = faker.helpers.arrayElement(userIds)
		memberships.push({
			userId: initialLeader,
			groupId: group.id,
			role: GroupRole.LEADER,
			joinedAt: faker.date.past(),
			status: MembershipStatus.APPROVED, // Leaders are always approved
		})

		// Optionally add one more leader (50% chance)
		if (faker.datatype.boolean()) {
			const secondLeader = faker.helpers.arrayElement(
				userIds.filter((id) => id !== initialLeader),
			)
			memberships.push({
				userId: secondLeader,
				groupId: group.id,
				role: GroupRole.LEADER,
				joinedAt: faker.date.past(),
				status: MembershipStatus.APPROVED, // Leaders are always approved
			})
		}

		// Add 3-15 regular members
		const memberCount = faker.number.int({ min: 3, max: 15 })
		const existingUserIds = memberships
			.filter((m) => m.groupId === group.id)
			.map((m) => m.userId)

		const members = faker.helpers.arrayElements(
			userIds.filter((id) => !existingUserIds.includes(id)),
			memberCount,
		)

		members.forEach((userId) => {
			// For private groups, create a mix of pending and approved members
			const status =
				group.isPrivate && faker.datatype.boolean({ probability: 0.3 })
					? MembershipStatus.PENDING
					: MembershipStatus.APPROVED

			memberships.push({
				userId,
				groupId: group.id,
				role: GroupRole.MEMBER,
				joinedAt: faker.date.past(),
				status,
			})
		})
	}

	await prisma.groupMembership.createMany({
		data: memberships,
	})
	console.timeEnd(`🤝 Created group memberships...`)

	// Make sure Kody is a leader of at least one group
	const kodyGroup = createdGroups[0]
	await prisma.groupMembership.upsert({
		where: {
			userId_groupId: {
				userId: kody.id,
				groupId: kodyGroup.id,
			},
		},
		update: {
			role: GroupRole.LEADER,
			status: MembershipStatus.APPROVED,
		},
		create: {
			userId: kody.id,
			groupId: kodyGroup.id,
			role: GroupRole.LEADER,
			joinedAt: faker.date.past(),
			status: MembershipStatus.APPROVED,
		},
	})

	// Make sure the other test user (mody) is a member of at least one group
	const modyGroup = createdGroups[1]
	await prisma.groupMembership.upsert({
		where: {
			userId_groupId: {
				userId: other.id,
				groupId: modyGroup.id,
			},
		},
		update: {
			role: GroupRole.MEMBER,
			status: MembershipStatus.APPROVED,
		},
		create: {
			userId: other.id,
			groupId: modyGroup.id,
			role: GroupRole.MEMBER,
			joinedAt: faker.date.past(),
			status: MembershipStatus.APPROVED,
		},
	})

	// Create group conversations
	console.time(`💬 Created group conversations...`)
	const familyConversation = await prisma.conversation.create({
		data: {
			groupId: createdGroups[0].id,
			participants: {
				connect: userIds.map((id) => ({ id })),
			},
		},
	})
	const friendsConversation = await prisma.conversation.create({
		data: {
			groupId: createdGroups[1].id,
			participants: {
				connect: userIds.map((id) => ({ id })),
			},
		},
	})
	console.timeEnd(`💬 Created group conversations...`)

	// Seed one-on-one messages for the default user (Kody)
	console.time(`✉️ Creating two-sided messages for Kody...`)
	const messageCount = 10 // Number of messages to create
	for (let i = 0; i < messageCount; i++) {
		const recipientId =
			userIds[faker.number.int({ min: 0, max: userIds.length - 1 })] // Randomly select a recipient

		// Find or create a conversation between Kody and the recipient
		let conversation = await prisma.conversation.findFirst({
			where: {
				participants: { every: { id: { in: [kody.id, recipientId] } } },
				groupId: null, // Ensure it's not a group conversation
			},
		})

		if (!conversation) {
			conversation = await prisma.conversation.create({
				data: {
					participants: {
						connect: [{ id: kody.id }, { id: recipientId }],
					},
				},
			})
		}

		// Create a message from Kody to the recipient
		const messageFromKody = await prisma.message.create({
			data: {
				senderId: kody.id,
				content: faker.lorem.sentence(),
				conversationId: conversation.id,
			},
		})

		// Update the conversation's lastMessageId
		await prisma.conversation.update({
			where: { id: conversation.id },
			data: { lastMessageId: messageFromKody.id },
		})

		// Create a reply from the recipient back to Kody
		const messageFromRecipient = await prisma.message.create({
			data: {
				senderId: recipientId,
				content: faker.lorem.sentence(),
				conversationId: conversation.id,
			},
		})

		// Update the conversation's lastMessageId again
		await prisma.conversation.update({
			where: { id: conversation.id },
			data: { lastMessageId: messageFromRecipient.id },
		})
	}
	console.timeEnd(`✉️ Created two-sided messages for Kody...`)

	// Seed group messages
	console.time(`✉️ Creating group messages...`)
	const groupMessageCount = 5 // Number of group messages per group
	for (const groupConversation of [familyConversation, friendsConversation]) {
		for (let i = 0; i < groupMessageCount; i++) {
			const senderId =
				userIds[faker.number.int({ min: 0, max: userIds.length - 1 })] // Randomly select a sender

			// Create a message in the group conversation
			const message = await prisma.message.create({
				data: {
					senderId: senderId,
					groupId: groupConversation.groupId,
					content: faker.lorem.sentence(),
					conversationId: groupConversation.id,
				},
			})

			// Update the conversation's lastMessageId
			await prisma.conversation.update({
				where: { id: groupConversation.id },
				data: { lastMessageId: message.id },
			})
		}
	}
	console.timeEnd(`✉️ Created group messages...`)

	// After creating users, add share items
	console.time(`📦 Creating share items...`)
	const shareItems = []
	for (const userId of userIds) {
		const itemCount = faker.number.int({ min: 8, max: 20 })
		for (let i = 0; i < itemCount; i++) {
			const shareType = faker.helpers.arrayElement(Object.values(ShareType))
			const claimed = faker.datatype.boolean(0.2)
			const claimedById = claimed
				? faker.helpers.arrayElement(userIds.filter((id) => id !== userId))
				: null

			shareItems.push({
				title: faker.commerce.productName(),
				description: faker.lorem.paragraph(),
				location: faker.location.city(),
				categoryId: faker.helpers.arrayElement(shareCategoryRecords).id,
				claimed,
				claimedAt: claimed ? faker.date.past() : null,
				claimedById,
				shareType,
				duration:
					shareType === ShareType.BORROW
						? faker.helpers.arrayElement([
								'1 week',
								'2 weeks',
								'1 month',
								'Flexible',
							])
						: null,
				userId,
				status: faker.helpers.arrayElement(Object.values(ContentStatus)),
				createdAt: faker.date.past(),
			})
		}
	}

	await prisma.shareItem.createMany({
		data: shareItems,
	})
	console.timeEnd(`📦 Creating share items...`)

	// After creating share items, add HelpFAQs
	console.time(`❓ Creating help FAQs...`)
	const helpFaqs = [
		{
			question: 'How do I create a prayer request?',
			answer:
				"Navigate to the Prayer section and click on 'New Prayer Request'. Fill out the form with your request details and submit.",
			category: 'Prayer',
			order: 1,
			active: true,
		},
		{
			question: 'Can I join multiple groups?',
			answer:
				"Yes, you can join as many groups as you'd like. Browse available groups in the Groups section and request to join those that interest you.",
			category: 'Groups',
			order: 1,
			active: true,
		},
		{
			question: 'How do I share an item with others?',
			answer:
				"Go to the Share section and click 'Share New Item'. Fill out the details about what you're sharing and whether it's for borrowing or giving away.",
			category: 'Sharing',
			order: 1,
			active: true,
		},
		{
			question: "What's the difference between borrowing and giving?",
			answer:
				"When you select 'Borrow', you're indicating the item will be returned after a period of time. 'Give' means you're donating the item permanently.",
			category: 'Sharing',
			order: 2,
			active: true,
		},
		{
			question: 'How do I update my profile information?',
			answer:
				"Click on your profile picture in the top right corner and select 'Settings'. From there, you can update your personal information.",
			category: 'Account',
			order: 1,
			active: true,
		},
	]

	await prisma.helpFAQ.createMany({
		data: helpFaqs,
	})
	console.timeEnd(`❓ Creating help FAQs...`)

	// After creating feedback entries, add notifications
	console.time(`🔔 Creating notifications...`)
	const notificationTypes = Object.values($Enums.NotificationType)

	// Create notifications for Kody
	const kodyNotifications = [
		{
			userId: kody.id,
			type: 'GROUP_JOIN_REQUEST',
			title: 'New join request',
			description: `${other.name} wants to join your Bible Study group`,
			actionUrl: `/groups/manage/${createdGroups[0].id}/?tab=requests`,
			read: false,
		},
		{
			userId: kody.id,
			type: 'SHARE_ITEM_REQUEST',
			title: 'Someone wants to borrow your item',
			description: 'Your power drill has been requested by a community member',
			actionUrl: `/share/items/manage`,
			read: true,
			readAt: faker.date.recent(),
		},
		{
			userId: kody.id,
			type: 'MESSAGE_RECEIVED',
			title: 'New message from Mody',
			description: 'Hey, can we meet up this weekend?',
			actionUrl: `/messages/${familyConversation.id}`,
			read: false,
		},
	]

	// Create notifications for other test user (Mody)
	const otherNotifications = [
		{
			userId: other.id,
			type: 'GROUP_APPROVED',
			title: 'Group join request approved',
			description:
				'Your request to join the Prayer Warriors group has been approved',
			actionUrl: `/groups/${createdGroups[1].id}`,
			read: false,
		},
		{
			userId: other.id,
			type: 'SHARE_ITEM_APPROVED',
			title: 'Borrow request approved',
			description: 'Your request to borrow the lawn mower has been approved',
			actionUrl: `/share/items/borrowed`,
			read: true,
			readAt: faker.date.recent(),
		},
	]

	// Create some random notifications for other users
	const randomNotifications = []
	for (const userId of userIds.filter(
		(id) => id !== kody.id && id !== other.id,
	)) {
		// Add 1-3 random notifications per user
		const notificationCount = faker.number.int({ min: 1, max: 3 })

		for (let i = 0; i < notificationCount; i++) {
			const type = faker.helpers.arrayElement(notificationTypes)
			const read = faker.datatype.boolean({ probability: 0.3 }) // 30% chance of being read

			randomNotifications.push({
				userId,
				type,
				title: faker.helpers.arrayElement([
					'New prayer request',
					'Group meeting reminder',
					'Your item was borrowed',
					'New message received',
					'Join request approved',
				]),
				description: faker.lorem.sentence(),
				actionUrl: faker.helpers.arrayElement([
					'/prayer/board',
					'/groups',
					'/share/board',
					'/messages',
				]),
				read,
				readAt: read ? faker.date.recent() : null,
			})
		}
	}

	// Create all notifications
	await prisma.notification.createMany({
		data: [...kodyNotifications, ...otherNotifications, ...randomNotifications],
	})

	console.timeEnd(`🔔 Creating notifications...`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

// we're ok to import from the test directory in this file
/*
eslint
	no-restricted-imports: "off",
*/