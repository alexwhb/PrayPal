import { Coffee, Heart } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '#app/components/ui/button'
import { type Route } from './+types/privacy'

export const meta: Route.MetaFunction = () => [{ title: 'Privacy Policy | PrayPal' }]

export default function PrivacyRoute() {
	return (
		<div className="container mx-auto max-w-4xl py-8">
			<h1 className="mb-10 text-center text-3xl font-bold">THIS IS A DRAFT AND INTENDED FOR DEMONSTRATION PURPOSES ONLY PLEASE AJUST DETAILS AS NEEDED</h1>

			<h1 className="mb-10 text-center text-3xl font-bold">Privacy Policy</h1>
			
			<div className="space-y-8">
				<p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
				
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">1. Introduction</h2>
					<p className="text-base leading-relaxed">
						PrayPal ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by PrayPal. This Privacy Policy applies to our website, and its associated subdomains (collectively, our "Service"). By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">2. Information We Collect</h2>
					
					<div className="space-y-3 pl-4">
						<h3 className="text-xl font-medium">2.1 Personal Information</h3>
						<p className="text-base leading-relaxed">
							When you use our Service, we may collect the following types of information:
						</p>
						<ul className="list-disc pl-5 space-y-2">
							<li className="text-base"><strong>Account Information:</strong> When you create an account, we collect your name, email address, username, and password.</li>
							<li className="text-base"><strong>Profile Information:</strong> This includes profile pictures, biographical information, and other details you choose to share.</li>
							<li className="text-base"><strong>Content:</strong> Information you provide through our Service, including prayer requests, community needs, shared items, group participation, messages, and feedback.</li>
							<li className="text-base"><strong>Communications:</strong> If you contact us directly, we may receive additional information about you such as your name, email address, phone number, the contents of the message and/or attachments you may send us, and any other information you may choose to provide.</li>
						</ul>
					</div>

					<div className="space-y-3 pl-4 mt-6">
						<h3 className="text-xl font-medium">2.2 Automatically Collected Information</h3>
						<p className="text-base leading-relaxed">
							When you visit our Service, we may automatically collect certain information about your device, including:
						</p>
						<ul className="list-disc pl-5 space-y-2">
							<li className="text-base"><strong>Log and Usage Data:</strong> Service-related information such as your IP address, browser type, operating system, referring URLs, access times, and pages viewed.</li>
							<li className="text-base"><strong>Device Information:</strong> Information about the device you are using to access our Service.</li>
							<li className="text-base"><strong>Cookies and Similar Technologies:</strong> We may use cookies and similar tracking technologies to track activity on our Service and hold certain information.</li>
						</ul>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
					<p className="text-base leading-relaxed">
						We use your personal information for various purposes, including to:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">Provide, maintain, and improve our Service</li>
						<li className="text-base">Create and manage your account</li>
						<li className="text-base">Process and complete transactions</li>
						<li className="text-base">Connect you with other community members through groups, prayer requests, and shared resources</li>
						<li className="text-base">Send you technical notices, updates, security alerts, and support messages</li>
						<li className="text-base">Respond to your comments, questions, and requests</li>
						<li className="text-base">Develop new products, services, features, and functionality</li>
						<li className="text-base">Monitor and analyze trends, usage, and activities in connection with our Service</li>
						<li className="text-base">Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
						<li className="text-base">Personalize and improve the Service</li>
					</ul>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">4. Sharing of Your Information</h2>
					<p className="text-base leading-relaxed">
						We may share your personal information in the following situations:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base"><strong>With Other Users:</strong> When you share information publicly through the Service, such as prayer requests, community needs, or group information, that information is visible to other users.</li>
						<li className="text-base"><strong>With Your Consent:</strong> We may share your information with third parties when you have given us your consent to do so.</li>
						<li className="text-base"><strong>Service Providers:</strong> We may share your information with third-party vendors, service providers, and other third parties who perform services on our behalf.</li>
						<li className="text-base"><strong>Legal Requirements:</strong> We may disclose your information where required to do so by law or subpoena.</li>
						<li className="text-base"><strong>Business Transfers:</strong> We may share or transfer your information in connection with a merger, sale, or acquisition of all or a portion of our assets.</li>
					</ul>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">5. Your Privacy Rights</h2>
					<p className="text-base leading-relaxed">
						Depending on your location, you may have certain rights regarding your personal information, including:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base"><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
						<li className="text-base"><strong>Correction:</strong> You can request that we correct inaccurate or incomplete information about you.</li>
						<li className="text-base"><strong>Deletion:</strong> You can request that we delete your personal information.</li>
						<li className="text-base"><strong>Restriction:</strong> You can request that we restrict the processing of your personal information.</li>
						<li className="text-base"><strong>Data Portability:</strong> You can request a copy of your personal information in a structured, commonly used, and machine-readable format.</li>
						<li className="text-base"><strong>Objection:</strong> You can object to our processing of your personal information.</li>
					</ul>
					<p className="text-base leading-relaxed mt-4">
						To exercise these rights, please contact us using the information provided in the "Contact Us" section below.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">6. California Privacy Rights</h2>
					<p className="text-base leading-relaxed">
						California residents have specific rights regarding their personal information under the California Consumer Privacy Act (CCPA). These include the right to:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">Know what personal information is being collected about them</li>
						<li className="text-base">Know whether their personal information is sold or disclosed and to whom</li>
						<li className="text-base">Decline the sale of their personal information</li>
						<li className="text-base">Access their personal information</li>
						<li className="text-base">Request the deletion of their personal information</li>
					</ul>
					<p className="text-base leading-relaxed mt-4">
						We do not sell personal information to third parties. We may disclose personal information to service providers as described in this Privacy Policy.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">7. Children's Privacy</h2>
					<p className="text-base leading-relaxed">
						Our Service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and you are aware that your child has provided us with personal information, please contact us so that we can take necessary actions.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">8. Data Security</h2>
					<p className="text-base leading-relaxed">
						We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no security measures are perfect or impenetrable, and we cannot guarantee the security of your data transmitted to our Service.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">9. Data Retention</h2>
					<p className="text-base leading-relaxed">
						We will retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy, unless a longer retention period is required or permitted by law.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">10. Changes to This Privacy Policy</h2>
					<p className="text-base leading-relaxed">
						We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">11. Contact Us</h2>
					<p className="text-base leading-relaxed">
						If you have any questions about this Privacy Policy or our practices, please contact us at:
					</p>
					<div className="mt-2 pl-4">
						<p className="text-base">
							Email: privacy@praypal.org<br />
							PrayPal<br />
							123 Church Street<br />
							Anytown, US 12345
						</p>
					</div>
				</section>
			</div>

			{/* Support the Project Section */}
			<div className="mt-20 border-t pt-8">
				<section className="text-center">
					<h2 className="mb-4 text-xl font-semibold">Support the Project</h2>
					<p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
						PrayPal is a free, open-source project maintained by Alex Black. If
						you find it useful, please consider supporting the development with a
						donation.
					</p>

					<div className="flex justify-center">
						<Button asChild variant="default" className="gap-2">
							<a
								href="https://www.buymeacoffee.com/alex.black"
								target="_blank"
								rel="noopener noreferrer"
								className="flex items-center"
							>
								<Coffee className="h-4 w-4" />
								<span>Buy Me a Coffee</span>
							</a>
						</Button>
					</div>

					<div className="mt-8 flex items-center justify-center text-sm text-muted-foreground">
						<Heart className="mr-2 h-4 w-4 text-red-500" />
						<span>Thank you for your support!</span>
					</div>
				</section>
			</div>
		</div>
	)
}