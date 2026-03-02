import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { getBlogPosts } from '../data/blog';
import { getProjects } from '../data/projects';

function HomePage() {
  const featuredPosts = getBlogPosts().slice(0, 3);
  const featuredProjects = getProjects().slice(0, 2);

  return (
    <div className="bg-white dark:bg-slate-950" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-blue-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 opacity-50"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="max-w-3xl flex-1">
              <div className="inline-flex items-center space-x-2 bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                <span>Data Engineering Thought Leadership</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                Building Scalable Data Platforms
              </h1>
              <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Specializing in Apache Spark, Delta Lake, and Databricks to architect lakehouse solutions
                that drive business value through efficient data governance and cost optimization.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/blog"
                  data-testid="cta-blog"
                  className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg group"
                >
                  Read Articles
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1" />
                </Link>
                <Link
                  to="/projects"
                  data-testid="cta-projects"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg"
                >
                  View Projects
                </Link>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img
                src="/profile.jpeg"
                alt="Kiran Kumar"
                className="w-48 h-48 lg:w-64 lg:h-64 rounded-full object-cover object-top border-4 border-white dark:border-slate-800 shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blog Posts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Latest Articles</h2>
            <p className="text-slate-600 dark:text-slate-400">Deep dives into data engineering topics</p>
          </div>
          <Link
            to="/blog"
            data-testid="view-all-posts"
            className="hidden sm:flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
          >
            View all
            <ArrowRight className="ml-1 w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPosts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              data-testid={`blog-card-${post.slug}`}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700"
            >
              <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400 mb-3">
                <span>{post.date}</span>
                <span>•</span>
                <span>{post.readTime}</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                {post.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">{post.excerpt}</p>
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 rounded-md"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="bg-slate-50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Featured Projects</h2>
              <p className="text-slate-600 dark:text-slate-400">Architecture case studies and implementations</p>
            </div>
            <Link
              to="/projects"
              data-testid="view-all-projects"
              className="hidden sm:flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium"
            >
              View all
              <ArrowRight className="ml-1 w-4 h-4" />
            </Link>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {featuredProjects.map((project) => (
              <Link
                key={project.slug}
                to={`/projects/${project.slug}`}
                data-testid={`project-card-${project.slug}`}
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{project.date}</span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  {project.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{project.excerpt}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-gradient-to-br from-cyan-600 to-blue-700 rounded-2xl p-8 sm:p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Let's Connect
          </h2>
          <p className="text-cyan-50 text-lg mb-8 max-w-2xl mx-auto">
            Always open to connecting with fellow data engineers, sharing knowledge, and discussing the latest in data platform technologies.
          </p>
          <Link
            to="/contact"
            data-testid="cta-contact"
            className="inline-flex items-center px-8 py-4 bg-white hover:bg-slate-50 text-cyan-700 font-medium rounded-lg"
          >
            Get in Touch
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
