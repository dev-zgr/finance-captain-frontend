import React from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function PrivacyPolicyPage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">Privacy Policy</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">1. Information We Collect</h2>
                    <ol className="list-decimal list-inside space-y-2 text-gray-700">
                        <li>
                            <strong>Personal Information:</strong> We may collect personal information such as your name, email
                            address, phone number, and other contact details when you register an account with Finance Captain.
                        </li>
                        <li>
                            <strong>Usage Data:</strong> We automatically collect information about how you interact with our
                            services, including your IP address, device information, browser type, and usage patterns.
                        </li>
                        <li>
                            <strong>Cookies:</strong> We use cookies and similar tracking technologies to enhance your user
                            experience and analyze usage trends.
                        </li>
                    </ol>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">2. How We Use Your Information</h2>
                    <p className="text-gray-700 mb-2">We may use the information we collect for various purposes, including:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>To provide, maintain, and improve our services.</li>
                        <li>To personalize your experience and offer tailored content.</li>
                        <li>To communicate with you, including sending promotional materials and updates.</li>
                        <li>To analyze usage patterns and trends to enhance our services.</li>
                        <li>To comply with legal obligations and resolve disputes.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">3. Data Sharing and Disclosure</h2>
                    <p className="text-gray-700 mb-2">We may share your information with third parties under certain circumstances, including:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>With service providers and business partners who assist us in providing our services.</li>
                        <li>With law enforcement or regulatory authorities in response to legal requests or to protect our rights.</li>
                        <li>In connection with a business transaction, such as a merger, acquisition, or sale of assets.</li>
                        <li>With your consent or at your direction.</li>
                    </ul>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">4. Data Retention</h2>
                    <p className="text-gray-700">
                        We will retain your information for as long as necessary to fulfill the purposes outlined in this privacy
                        policy, unless a longer retention period is required or permitted by law.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">5. Security</h2>
                    <p className="text-gray-700">
                        We take reasonable measures to protect your information from unauthorized access, alteration, disclosure,
                        or destruction. However, no method of transmission over the internet or electronic storage is completely
                        secure, so we cannot guarantee absolute security.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">6. Your Rights</h2>
                    <p className="text-gray-700 mb-2">You have certain rights regarding your personal information, including:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                        <li>The right to access, update, or delete your information.</li>
                        <li>The right to object to the processing of your information.</li>
                        <li>The right to restrict the processing of your information.</li>
                        <li>The right to data portability.</li>
                        <li>The right to withdraw consent.</li>
                    </ul>
                    <p className="text-gray-700 mt-2">
                        Please contact us if you wish to exercise any of these rights.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">7. Changes to This Privacy Policy</h2>
                    <p className="text-gray-700">
                        We may update this privacy policy from time to time to reflect changes in our practices or for other
                        operational, legal, or regulatory reasons. We will notify you of any material changes by posting the new
                        privacy policy on this page.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">8. Contact Us</h2>
                    <p className="text-gray-700">
                        If you have any questions or concerns about this privacy policy, please contact us at{" "}
                        <a href="mailto:support@financecaptain.com" className="text-sky-500 underline">support@financecaptain.com</a>.
                    </p>
                </section>
            </div>
        </AppShell>
    );
}