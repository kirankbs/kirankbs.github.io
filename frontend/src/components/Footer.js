import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Linkedin, Mail } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">DE</span>
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Data Engineer
              </span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-md">
              Specializing in Apache Spark, Delta Lake, Databricks, and Lakehouse Architecture.
              Building scalable data platforms with a focus on governance and cost optimization.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/projects"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm"
                >
                  Projects
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Connect</h3>
            <div className="flex space-x-4">
              <a
                href="https://github.com/kirankbs"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-github"
                className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="https://www.linkedin.com/in/kirankbs/"
                target="_blank"
                rel="noopener noreferrer"
                data-testid="footer-linkedin"
                className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="mailto:kiranprofessional2@gmail.com"
                data-testid="footer-email"
                className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400"
                aria-label="Email"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>&copy; {currentYear} Data Engineer. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
