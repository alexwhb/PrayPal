import { faker } from '@faker-js/faker'
import { promiseHash } from 'remix-utils/promise'
import { prisma } from '#app/utils/db.server.ts'
import { MOCK_CODE_GITHUB } from '#app/utils/providers/constants'
import {
	createPassword,
	createUser,
	getUserImages,
	img,
} from '#tests/db-utils.ts'
import { insertGitHubUser } from '#tests/mocks/github.ts'

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

	// First, create categories for both PRAYER and NEED types
	const prayerCategories = [
		'Spiritual Growth',
		'Health & Healing',
		'Family & Relationships',
		'Work & Career',
		'Guidance & Direction',
		'Emotional Support',
		'Financial Breakthrough',
		'Education',
	]

	const needCategories = [
		'Food & Groceries',
		'Housing & Shelter',
		'Transportation',
		'Medical & Healthcare',
		'Education & Training',
		'Clothing',
		'Financial Assistance',
		'Home Repairs',
	]

	// Create all categories
	await prisma.category.createMany({
		data: [
			...prayerCategories.map((name) => ({
				type: 'PRAYER',
				name,
				active: true,
			})),
			...needCategories.map((name) => ({
				type: 'NEED',
				name,
				active: true,
			})),
		],
	})

	// Fetch created categories for reference
	const prayerCategoryRecords = await prisma.category.findMany({
		where: { type: 'PRAYER', active: true },
	})

	const needCategoryRecords = await prisma.category.findMany({
		where: { type: 'NEED', active: true },
	})

	// Update user creation to include requests
	const userIds = []
	for (let index = 0; index < totalUsers; index++) {
		const userData = createUser()
		const user = await prisma.user.create({
			data: {
				...userData,
				password: { create: createPassword(userData.username) },
				image: { create: userImages[index % userImages.length] },
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
									type: 'PRAYER' as const, // Explicitly type as RequestType
									categoryId: faker.helpers.arrayElement(prayerCategoryRecords)
										.id,
									description: faker.lorem.paragraph(),
									fulfilled: fulfilled,
									status: faker.helpers.arrayElement([
										'ACTIVE',
										'PENDING',
									] as const),
									flagged: faker.datatype.boolean(),
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
								length: faker.number.int({ min: 0, max: 3 }),
							}).map(() => ({
								type: 'NEED' as const, // Explicitly type as RequestType
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
									'ACTIVE',
									'PENDING',
								] as const),
								flagged: faker.datatype.boolean(),
								response: null,
							})),
						],
					},
				},
			},
		})
		userIds.push(user.id) // Store user IDs for later use
	}
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created admin user "kody"`)

	const kodyImages = await promiseHash({
		kodyUser: img({ filepath: './tests/fixtures/images/user/kody.png' }),
		cuteKoala: img({
			altText: 'an adorable koala cartoon illustration',
			filepath: './tests/fixtures/images/kody-notes/cute-koala.png',
		}),
		koalaEating: img({
			altText: 'a cartoon illustration of a koala in a tree eating',
			filepath: './tests/fixtures/images/kody-notes/koala-eating.png',
		}),
		koalaCuddle: img({
			altText: 'a cartoon illustration of koalas cuddling',
			filepath: './tests/fixtures/images/kody-notes/koala-cuddle.png',
		}),
		mountain: img({
			altText: 'a beautiful mountain covered in snow',
			filepath: './tests/fixtures/images/kody-notes/mountain.png',
		}),
		koalaCoder: img({
			altText: 'a koala coding at the computer',
			filepath: './tests/fixtures/images/kody-notes/koala-coder.png',
		}),
		koalaMentor: img({
			altText:
				'a koala in a friendly and helpful posture. The Koala is standing next to and teaching a woman who is coding on a computer and shows positive signs of learning and understanding what is being explained.',
			filepath: './tests/fixtures/images/kody-notes/koala-mentor.png',
		}),
		koalaSoccer: img({
			altText: 'a cute cartoon koala kicking a soccer ball on a soccer field ',
			filepath: './tests/fixtures/images/kody-notes/koala-soccer.png',
		}),
	})

	const githubUser = await insertGitHubUser(MOCK_CODE_GITHUB)

	const kody = await prisma.user.create({
		select: { id: true },
		data: {
			email: 'kody@kcd.dev',
			username: 'kody',
			name: 'Kody',
			image: { create: kodyImages.kodyUser },
			password: { create: createPassword('kodylovesyou') },
			connections: {
				create: { providerName: 'github', providerId: githubUser.profile.id },
			},
			roles: { connect: [{ name: 'admin' }, { name: 'user' }] },
		},
	})
	console.timeEnd(`🐨 Created admin user "kody"`)

	// Seed one-on-one messages for the default user (Kody)
	console.time(`✉️ Creating two-sided messages for Kody...`)
	const messageCount = 10 // Number of messages to create
	for (let i = 0; i < messageCount; i++) {
		const recipientId =
			userIds[faker.number.int({ min: 0, max: totalUsers - 1 })] // Randomly select a recipient from the created users

		// Create a message from Kody to the recipient
		await prisma.message.create({
			data: {
				senderId: kody.id,
				recipientId: recipientId,
				content: faker.lorem.sentence(),
			},
		})

		// Create a reply from the recipient back to Kody
		await prisma.message.create({
			data: {
				senderId: recipientId,
				recipientId: kody.id,
				content: faker.lorem.sentence(),
			},
		})
	}
	console.timeEnd(`✉️ Created two-sided messages for Kody...`)

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
