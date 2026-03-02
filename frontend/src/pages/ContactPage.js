import React from 'react';
import { Mail, Github, Linkedin, Send } from 'lucide-react';

function ContactPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="contact-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Get In Touch
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Interested in discussing data platform architecture, lakehouse design, or collaboration opportunities?
            I'd love to hear from you.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <a
            href="mailto:kiranprofessional2@gmail.com"
            data-testid="contact-email"
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 text-center"
          >
            <div className="inline-flex p-4 bg-cyan-50 dark:bg-cyan-950 rounded-full mb-4 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900">
              <Mail className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Email</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">kiranprofessional2@gmail.com</p>
          </a>

          <a
            href="https://www.linkedin.com/in/kirankbs/"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="contact-linkedin"
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 text-center"
          >
            <div className="inline-flex p-4 bg-cyan-50 dark:bg-cyan-950 rounded-full mb-4 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900">
              <Linkedin className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">LinkedIn</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Connect on LinkedIn</p>
          </a>

          <a
            href="https://github.com/kirankbs"
            target="_blank"
            rel="noopener noreferrer"
            data-testid="contact-github"
            className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700 text-center"
          >
            <div className="inline-flex p-4 bg-cyan-50 dark:bg-cyan-950 rounded-full mb-4 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900">
              <Github className="w-8 h-8 text-cyan-600 dark:text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">GitHub</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm">View my projects</p>
          </a>
        </div>

        {/* Quick Message Section */}
        <div className="bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-cyan-600 rounded-lg">
              <Send className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                Quick Contact
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                For inquiries, collaborations, or speaking engagements, feel free to reach out via email.
                I typically respond within 24-48 hours.
              </p>
              <a
                href="mailto:kiranprofessional2@gmail.com"
                className="inline-flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg"
              >
                Send Email
                <Mail className="ml-2 w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ContactPage;
