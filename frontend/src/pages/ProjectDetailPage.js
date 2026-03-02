import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Github, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { getProject } from '../data/projects';
import 'highlight.js/styles/github-dark.css';

function ProjectDetailPage() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Project not found</h1>
          <Link to="/projects" className="text-cyan-600 dark:text-cyan-400 hover:underline">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white dark:bg-slate-950" data-testid="project-detail-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          to="/projects"
          data-testid="back-to-projects"
          className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 mb-8 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Projects
        </Link>

        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            {project.title}
          </h1>
          <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-400 mb-6">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>{project.date}</span>
            </div>
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="project-github"
                className="inline-flex items-center hover:text-cyan-600 dark:hover:text-cyan-400"
              >
                <Github className="w-4 h-4 mr-1" />
                View on GitHub
              </a>
            )}
          </div>
        </header>

        <div className="prose prose-slate dark:prose-invert max-w-none" data-testid="project-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight, rehypeRaw]}
          >
            {project.content}
          </ReactMarkdown>
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/projects"
            className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            More Projects
          </Link>
        </footer>
      </div>
    </article>
  );
}

export default ProjectDetailPage;
