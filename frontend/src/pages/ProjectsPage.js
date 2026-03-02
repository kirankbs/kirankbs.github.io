import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Calendar, Github, ExternalLink } from 'lucide-react';
import { getProjects } from '../data/projects';

function ProjectsPage() {
  const projects = getProjects();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="projects-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Projects
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Architecture case studies and real-world implementations of data platform solutions.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {projects.map((project) => (
            <article
              key={project.slug}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-xl hover:border-cyan-300 dark:hover:border-cyan-700"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400">
                    <Calendar className="w-4 h-4" />
                    <span>{project.date}</span>
                  </div>
                </div>

                <Link to={`/projects/${project.slug}`} data-testid={`project-${project.slug}`}>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    {project.title}
                  </h2>
                </Link>

                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  {project.excerpt}
                </p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center space-x-4">
                  <Link
                    to={`/projects/${project.slug}`}
                    className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
                  >
                    View Details
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </Link>
                  {project.githubUrl && (
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <Github className="w-4 h-4 mr-1" />
                      GitHub
                    </a>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProjectsPage;
