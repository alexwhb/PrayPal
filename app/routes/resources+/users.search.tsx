// app/routes/resources.users.search.tsx

import { data } from 'react-router'
import { z } from "zod";
import { prisma } from "#app/utils/db.server.ts";
import {type Route} from "./+types/users.search.ts";

// Keep the result schema the same
const UserSearchResultSchema = z.object({
	id: z.string(),
	name: z.string().nullable(),
	username: z.string(),
	email: z.string(),
	imageId: z.string().nullable(),
});

export type UserSearchResult = z.infer<typeof UserSearchResultSchema>;

const SearchQuerySchema = z.object({
	q: z.string().min(1, "Search query is required").max(100),
});

export async function loader({ request }: Route.LoaderArgs) {
	// Optional: await requireUserId(request);

	const url = new URL(request.url);
	const result = SearchQuerySchema.safeParse({ q: url.searchParams.get("q") });

	if (!result.success) {
		return data([], { status: 400 });  // Make sure to return empty array
	}

	const query = result.data.q;
	// Prepare the search term for LIKE query (add wildcards)
	const likeQuery = `%${query}%`;

	console.log(`likeQuery: ${likeQuery}`)

	try {
		// Use Prisma.$queryRaw for case-insensitive search in SQLite
		// We use LOWER() on both the column and the search term
		const users = await prisma.$queryRaw<UserSearchResult[]>`
      SELECT 
        "User".id, 
        "User".name, 
        "User".username, 
        "User".email,
        "UserImage".id as "imageId"
      FROM "User"
      LEFT JOIN "UserImage" ON "User".id = "UserImage"."userId"
      WHERE (LOWER("User".name) LIKE LOWER(${likeQuery}))
         OR (LOWER("User".username) LIKE LOWER(${likeQuery}))
         OR (LOWER("User".email) LIKE LOWER(${likeQuery}))
      LIMIT 10
    `;

		// Although $queryRaw is typed, an extra validation doesn't hurt
		// especially if the raw query becomes complex later.
		const validatedUsers = z.array(UserSearchResultSchema).parse(users);
		return data(validatedUsers);  // Make sure to wrap response in data()
	} catch (error) {
		return data([], { status: 500 });  // Return empty array on error
	}
}
