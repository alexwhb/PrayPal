import { Button } from '#app/components/ui/button'
import { type Route } from './+types/tos'
import { Icon } from '#app/components/ui/icon.tsx'

export const meta: Route.MetaFunction = () => [{ title: 'Terms of Service | PrayPal' }]

export default function TermsOfServiceRoute() {
	return (
		<div className="container mx-auto max-w-4xl py-8">
			<h1 className="mb-10 text-center text-3xl font-bold">THIS IS A DRAFT AND INTENDED FOR DEMONSTRATION PURPOSES ONLY PLEASE ADJUST DETAILS AS NEEDED</h1>
			
			<h1 className="mb-10 text-center text-3xl font-bold">Terms of Service</h1>
			
			<div className="space-y-8">
				<p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
				
				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">1. Introduction</h2>
					<p className="text-base leading-relaxed">
						Welcome to PrayPal ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of the PrayPal website, mobile application, and services (collectively, the "Service"). By accessing or using our Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">2. Definitions</h2>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base"><strong>"Content"</strong> means any text, images, photos, audio, video, or other material that is posted, uploaded, or otherwise made available through the Service.</li>
						<li className="text-base"><strong>"User Content"</strong> means any Content that is submitted, posted, or displayed by users of the Service, including prayer requests, community needs, shared items, group information, and comments.</li>
						<li className="text-base"><strong>"PrayPal Content"</strong> means all Content that is owned by or licensed to PrayPal.</li>
						<li className="text-base"><strong>"User"</strong> or <strong>"you"</strong> means any individual who accesses or uses the Service.</li>
					</ul>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">3. Account Registration and Eligibility</h2>
					<p className="text-base leading-relaxed">
						To use certain features of the Service, you must register for an account. When you register, you agree to:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">Provide accurate, current, and complete information about yourself.</li>
						<li className="text-base">Maintain and promptly update your account information.</li>
						<li className="text-base">Keep your password secure and confidential.</li>
						<li className="text-base">Notify us immediately of any unauthorized use of your account.</li>
						<li className="text-base">Be responsible for all activities that occur under your account.</li>
					</ul>
					<p className="text-base leading-relaxed mt-4">
						You must be at least 13 years old to use the Service. If you are under 18, you must have permission from a parent or guardian to use the Service, and they must agree to these Terms on your behalf.
					</p>
					<p className="text-base leading-relaxed mt-4">
						By creating an account, you represent and warrant that you meet all of the foregoing eligibility requirements. If you do not meet all these requirements, you must not access or use the Service.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">4. User Content</h2>
					<p className="text-base leading-relaxed">
						Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material. You are responsible for the User Content that you post to the Service, including its legality, reliability, and appropriateness.
					</p>
					<p className="text-base leading-relaxed mt-4">
						By posting User Content to the Service, you grant PrayPal a non-exclusive, royalty-free, transferable, sublicensable, worldwide license to use, display, reproduce, and distribute your User Content in connection with operating and providing the Service to you and other users.
					</p>
					<p className="text-base leading-relaxed mt-4">
						You represent and warrant that: (i) the User Content is yours or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your User Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">5. Prohibited Activities</h2>
					<p className="text-base leading-relaxed">
						In using our Service, you agree not to:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">Use the Service for any illegal purpose or in violation of any local, state, national, or international law.</li>
						<li className="text-base">Violate or encourage others to violate the rights of third parties, including intellectual property rights.</li>
						<li className="text-base">Post, upload, or distribute any User Content that is unlawful, defamatory, libelous, inaccurate, or that a reasonable person could deem to be objectionable, profane, indecent, pornographic, harassing, threatening, hateful, or otherwise inappropriate.</li>
						<li className="text-base">Impersonate any person or entity, falsely claim an affiliation with any person or entity, or access the Service accounts of others without permission.</li>
						<li className="text-base">Interfere with or disrupt the operation of the Service or the servers or networks used to make the Service available, including by hacking or defacing any portion of the Service.</li>
						<li className="text-base">Use the Service to send unsolicited communications, promotions, or advertisements, or to spam, phish, or pharm others.</li>
						<li className="text-base">Harvest or collect email addresses or other contact information of other users from the Service.</li>
						<li className="text-base">Use the Service to advertise or offer to sell or buy any goods or services without our express prior written consent.</li>
						<li className="text-base">Reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service without our express prior written consent.</li>
						<li className="text-base">Use bots, spiders, crawlers, or other automated methods to access the Service or extract data.</li>
					</ul>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">6. Privacy</h2>
					<p className="text-base leading-relaxed">
						Your privacy is important to us. Our Privacy Policy, which is incorporated into these Terms, explains how we collect, use, and protect your information. By using our Service, you agree to our collection, use, and disclosure of information as described in our Privacy Policy.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">7. Intellectual Property Rights</h2>
					<p className="text-base leading-relaxed">
						The Service and its original content (excluding User Content), features, and functionality are and will remain the exclusive property of PrayPal and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of PrayPal.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">8. DMCA Notice and Takedown Procedure</h2>
					<p className="text-base leading-relaxed">
						If you believe that your copyrighted work has been copied in a way that constitutes copyright infringement and is accessible via the Service, please notify our copyright agent as set forth in the Digital Millennium Copyright Act of 1998 (DMCA). For your complaint to be valid under the DMCA, you must provide the following information in writing:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">An electronic or physical signature of a person authorized to act on behalf of the copyright owner.</li>
						<li className="text-base">Identification of the copyrighted work that you claim has been infringed.</li>
						<li className="text-base">Identification of the material that is claimed to be infringing and where it is located on the Service.</li>
						<li className="text-base">Information reasonably sufficient to permit us to contact you, such as your address, telephone number, and email address.</li>
						<li className="text-base">A statement that you have a good faith belief that use of the material in the manner complained of is not authorized by the copyright owner, its agent, or law.</li>
						<li className="text-base">A statement, made under penalty of perjury, that the above information is accurate, and that you are the copyright owner or are authorized to act on behalf of the owner.</li>
					</ul>
					<p className="text-base leading-relaxed mt-4">
						The above information must be submitted to our designated copyright agent at:
					</p>
					<div className="mt-2 pl-4">
						<p className="text-base">
							DMCA Compliance<br />
							PrayPal<br />
							123 Church Street<br />
							Anytown, US 12345<br />
							Email: copyright@praypal.org
						</p>
					</div>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">9. Termination</h2>
					<p className="text-base leading-relaxed">
						We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
					</p>
					<p className="text-base leading-relaxed mt-4">
						If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion. All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">10. Limitation of Liability</h2>
					<p className="text-base leading-relaxed">
						In no event shall PrayPal, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">Your access to or use of or inability to access or use the Service.</li>
						<li className="text-base">Any conduct or content of any third party on the Service.</li>
						<li className="text-base">Any content obtained from the Service.</li>
						<li className="text-base">Unauthorized access, use, or alteration of your transmissions or content.</li>
					</ul>
					<p className="text-base leading-relaxed mt-4">
						To the maximum extent permitted by applicable law, in no event shall the total liability of PrayPal and its affiliates for all claims relating to the Service exceed the amount paid by you, if any, to PrayPal for the Service during the 12 months immediately preceding the date of the claim.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">11. Disclaimer</h2>
					<p className="text-base leading-relaxed">
						Your use of the Service is at your sole risk. The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
					</p>
					<p className="text-base leading-relaxed mt-4">
						PrayPal, its subsidiaries, affiliates, and its licensors do not warrant that:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li className="text-base">The Service will function uninterrupted, secure, or available at any particular time or location.</li>
						<li className="text-base">Any errors or defects will be corrected.</li>
						<li className="text-base">The Service is free of viruses or other harmful components.</li>
						<li className="text-base">The results of using the Service will meet your requirements.</li>
					</ul>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">12. Indemnification</h2>
					<p className="text-base leading-relaxed">
						You agree to defend, indemnify, and hold harmless PrayPal, its parent, subsidiaries, affiliates, and its licensors, and their respective officers, directors, employees, contractors, agents, licensors, and suppliers from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising out of or relating to your violation of these Terms or your use of the Service, including, but not limited to, your User Content, any use of the Service's content, services, and products other than as expressly authorized in these Terms, or your use of any information obtained from the Service.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">13. Governing Law</h2>
					<p className="text-base leading-relaxed">
						These Terms shall be governed and construed in accordance with the laws of the United States of America and the State of [Your State], without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">14. Changes to Terms</h2>
					<p className="text-base leading-relaxed">
						We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
					</p>
				</section>

				<section className="space-y-4">
					<h2 className="text-2xl font-semibold">15. Contact Us</h2>
					<p className="text-base leading-relaxed">
						If you have any questions about these Terms, please contact us at:
					</p>
					<div className="mt-2 pl-4">
						<p className="text-base">
							Email: terms@praypal.org<br />
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
								<Icon name="coffee"  className="h-4 w-4" />
								<span>Buy Me a Coffee</span>
							</a>
						</Button>
					</div>

					<div className="mt-8 flex items-center justify-center text-sm text-muted-foreground">
						<Icon name="heart"  className="mr-2 h-4 w-4 text-red-500" />
						<span>Thank you for your support!</span>
					</div>
				</section>
			</div>
		</div>
	)
}