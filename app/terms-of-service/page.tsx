import React from 'react';

import { AppShell } from '@/components/layout/AppShell';

export default function TermsOfServicePage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Terms of Service</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Acceptance of Terms</h2>
                    <p className="text-gray-700 mb-1">
                        Welcome to Finance Captain! By accessing or using our platform, you agree to comply with these Terms of
                        Service (&quot;Terms&quot;) and all applicable laws and regulations. If you do not agree with any of these
                        terms, you are prohibited from using or accessing this site.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">2. Use of the Platform</h2>
                    <p className="text-gray-700 mb-1">
                        Finance Captain grants you a non-exclusive, non-transferable, revocable license to use the platform for
                        your personal or internal business purposes. You agree not to reproduce, duplicate, copy, sell,
                        resell, or exploit any portion of the platform without express written permission.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">3. User Accounts</h2>
                    <p className="text-gray-700 mb-1">
                        In order to access certain features of Finance Captain, you may be required to create an account. You
                        are responsible for maintaining the confidentiality of your account credentials and for all
                        activities that occur under your account.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Intellectual Property Rights</h2>
                    <p className="text-gray-700 mb-1">
                        All content and materials available on Finance Captain, including but not limited to text, graphics,
                        logos, images, software, and audio/video clips, are the property of Finance Captain or its licensors and
                        are protected by intellectual property laws.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Limitation of Liability</h2>
                    <p className="text-gray-700 mb-1">
                        Finance Captain shall not be liable for any indirect, incidental, special, consequential, or punitive
                        damages arising out of or relating to your use or inability to use the platform, even if Finance Captain
                        has been advised of the possibility of such damages.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Governing Law</h2>
                    <p className="text-gray-700 mb-1">
                        These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction],
                        without regard to its conflict of law principles. Any disputes arising out of or in connection
                        with these Terms shall be resolved in the courts of [Jurisdiction].
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Changes to Terms</h2>
                    <p className="text-gray-700 mb-1">
                        Finance Captain reserves the right to modify or revise these Terms at any time, and such changes will be
                        effective immediately upon posting on this page. Your continued use of the platform constitutes
                        your acceptance of the revised Terms.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">8. Contact Us</h2>
                    <p className="text-gray-700">
                        If you have any questions or concerns about these Terms of Service, please contact us at{" "}
                        <a href="mailto:support@financecaptain.com" className="text-sky-500 underline">support@financecaptain.com</a>.
                    </p>
                </section>
            </div>
        </AppShell>
    );
}
