import React from 'react';

import { AppShell } from '@/components/layout/AppShell';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/components/ui/card";

export default function AboutUsPage() {
    return (
        <AppShell>
            <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
                <h1 className="text-3xl font-bold mb-6 text-gray-900">About Finance Captain</h1>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Our Mission</h2>
                    <p className="text-gray-700 mb-1">
                        Finance Captain is an AI-powered, autonomous personal financial management platform designed to eliminate the "operational friction" and high cognitive load associated with traditional tools Our goal is to transform financial tracking from a reactive burden into a proactive, strategic management experience.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Autonomous Financial Intelligence</h2>
                    <p className="text-gray-700 mb-1">
                        By leveraging advanced Agentic AI, Large Language Models (LLM), and Vision-Language Models (VLM), Finance Captain automates the most tedious parts of budgeting. Users can record expenses through natural language commands or by simply uploading images of physical receipts, which are processed automatically using VLM technology.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Investment & Portfolio Strategy</h2>
                    <p className="text-gray-700 mb-1">
                        Beyond basic expense tracking, the platform offers a sophisticated simulation environment for the Nasdaq100 index. Our Agentic AI autonomously scans and summarizes market news to provide actionable insights tailored specifically to your portfolio, ensuring you stay informed without the information overload.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Advanced Forecasting & Reporting</h2>
                    <p className="text-gray-700 mb-1">
                        Using Linear Regression models on historical data, Finance Captain generates future cash flow forecasts to help you plan ahead. These insights are compiled into corporate-standard PDF reports via a specialized LaTeX-based engine, providing professional-grade documentation of your financial health.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">The Team</h2>
                    <p className="text-gray-700 mb-1">
                        Finance Captain was developed by Hüseyin Özgür Kamalı as a senior graduation project at Ankara University. Built with a focus on modern software engineering principles and the latest advancements in AI, this project represents a commitment to making high-level financial intelligence accessible to everyone.
                    </p>
                </section>

                <section className="mb-8">
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Contact Us</h2>
                    <p className="text-gray-700">
                        If you have questions about our technology or the development of the platform, please reach out to us at{" "}
                        <a href="mailto:support@financecaptain.com" className="text-sky-500 underline">support@financecaptain.com</a>.
                    </p>
                </section>
            </div>
        </AppShell>
    );
}
