// TODO. This will be really mostly just a panel where you can see the current
// stats of the app, such as how many users are registered, how many posts are
// created, etc. Oh there should also be a view where the admin can modify the
// available categories for prayers and needs.

// There should also be a site settings page where the admin can modify
// things like, the sites name... they should also be able to change things like
// are users automatically allowed to post once an account has been created? Or
// do they need to be approved by an admin first? Since this is potentially
// just for a single small church body, that should be quite possible, and
// would massively reduce the amount of spam that gets posted.


import { logout, requireUserId } from '#app/utils/auth.server.ts'
import  { type Route } from '../../../.react-router/types/app/routes/+types/me.ts'

export async function loader({ request }: Route.LoaderArgs) {

	// todo test if a user has admin permissions
	const userId = await requireUserId(request)
	

// TODO this is how we should handle if you are not an admin. 	
	await logout({ request, redirectTo: '/' })

}


export default function Index() {
	return <main>Admin</main>
}