import React from 'react';
import { Award, ExternalLink } from 'lucide-react';
import { certifications } from '../data/certifications';

function CertificationsPage() {

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="certifications-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Certifications
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Professional certifications validating expertise in data engineering, cloud platforms, and big data technologies.
          </p>
        </div>

        {/* Certifications Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certifications.map((cert, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700"
              data-testid={`certification-${index}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                  <Award className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{cert.date}</span>
              </div>

              {cert.badge && (
                <div className="mb-4 flex justify-center">
                  <img src={cert.badge} alt={cert.title} className="h-24 object-contain" />
                </div>
              )}

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {cert.title}
              </h3>
              <p className="text-cyan-600 dark:text-cyan-400 font-medium mb-3">{cert.issuer}</p>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">{cert.description}</p>

              {cert.link && (
                <a
                  href={cert.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium"
                >
                  Learn More
                  <ExternalLink className="ml-1 w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CertificationsPage;
