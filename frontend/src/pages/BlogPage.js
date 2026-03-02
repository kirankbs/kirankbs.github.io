import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock } from 'lucide-react';
import { getBlogPosts } from '../data/blog';

function BlogPage() {
  const posts = getBlogPosts();
  const [selectedTag, setSelectedTag] = React.useState('all');

  const allTags = ['all', ...new Set(posts.flatMap(post => post.tags))];
  const filteredPosts = selectedTag === 'all' 
    ? posts 
    : posts.filter(post => post.tags.includes(selectedTag));

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="blog-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Blog
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Technical deep dives, architecture patterns, and best practices in data engineering.
          </p>
        </div>

        {/* Tags Filter */}
        <div className="mb-8 flex flex-wrap gap-2" data-testid="tag-filter">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              data-testid={`tag-${tag}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedTag === tag
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <article
              key={post.slug}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700"
            >
              <Link to={`/blog/${post.slug}`} data-testid={`blog-post-${post.slug}`}>
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{post.date}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                    {post.title}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
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
                </div>
              </Link>
            </article>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12" data-testid="no-posts">
            <p className="text-slate-600 dark:text-slate-400">No posts found for this tag.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogPage;
