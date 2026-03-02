import React from 'react';
import { Briefcase, Calendar, Award } from 'lucide-react';
import { timeline, skills } from '../data/about';

function AboutPage() {

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="about-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 mb-6">
            <img
              src="/profile.jpeg"
              alt="Kiran Kumar"
              className="w-32 h-32 rounded-full object-cover object-top border-4 border-white dark:border-slate-800 shadow-lg flex-shrink-0"
            />
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
              About Me
            </h1>
          </div>
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              I'm a Data Engineer specializing in building scalable, efficient data platforms that drive
              business value. With deep expertise in Apache Spark, Delta Lake, and Databricks, I architect
              lakehouse solutions that prioritize data governance, cost optimization, and performance.
            </p>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
              My approach combines technical excellence with business acumen, ensuring that data
              infrastructure not only scales but also delivers measurable ROI through intelligent design
              and implementation.
            </p>
          </div>
        </div>

        {/* Professional Philosophy */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Professional Philosophy</h2>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
              Data engineering is not just about moving data—it's about creating robust, maintainable
              systems that enable organizations to make data-driven decisions at scale. I believe in:
            </p>
            <ul className="mt-4 space-y-2 text-slate-700 dark:text-slate-300">
              <li className="flex items-start">
                <span className="text-cyan-600 dark:text-cyan-400 mr-2">•</span>
                <span>Architecture-first thinking: Building foundations that scale</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-600 dark:text-cyan-400 mr-2">•</span>
                <span>Cost-conscious engineering: Optimizing for performance and budget</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-600 dark:text-cyan-400 mr-2">•</span>
                <span>Data governance by design: Security and quality from day one</span>
              </li>
              <li className="flex items-start">
                <span className="text-cyan-600 dark:text-cyan-400 mr-2">•</span>
                <span>Continuous learning: Staying ahead in a rapidly evolving field</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Career Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <Briefcase className="w-6 h-6 mr-2 text-cyan-600 dark:text-cyan-400" />
            Career Journey
          </h2>
          <div className="space-y-6">
            {timeline.map((item, index) => (
              <div
                key={index}
                className="relative pl-8 pb-8 border-l-2 border-slate-200 dark:border-slate-800 last:pb-0 last:border-l-0"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-cyan-600 dark:bg-cyan-400"></div>
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>{item.year}</span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{item.role}</h3>
                <p className="text-cyan-600 dark:text-cyan-400 font-medium mb-2">{item.company}</p>
                <p className="text-slate-600 dark:text-slate-400">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center">
            <Award className="w-6 h-6 mr-2 text-cyan-600 dark:text-cyan-400" />
            Technical Expertise
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {skills.map((skillGroup, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
                  {skillGroup.category}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {skillGroup.items.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-lg text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AboutPage;
