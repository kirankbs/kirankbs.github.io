import React from 'react';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { resources } from '../data/resources';

function ResourcesPage() {

  const categories = ['All', ...new Set(resources.map(r => r.category))];
  const [selectedCategory, setSelectedCategory] = React.useState('All');

  const filteredResources = selectedCategory === 'All'
    ? resources
    : resources.filter(r => r.category === selectedCategory);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="resources-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Resources
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Curated collection of guides, templates, and references for data engineering professionals.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 flex flex-wrap gap-2" data-testid="category-filter">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              data-testid={`category-${category}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                selectedCategory === category
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((resource, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg hover:border-cyan-300 dark:hover:border-cyan-700"
              data-testid={`resource-${index}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-cyan-50 dark:bg-cyan-950 rounded-lg">
                  <FileText className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded">
                  {resource.type}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                {resource.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                {resource.description}
              </p>

              <a
                href={resource.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-medium text-sm"
              >
                {resource.type === 'External' ? (
                  <>
                    Visit Resource
                    <ExternalLink className="ml-1 w-4 h-4" />
                  </>
                ) : (
                  <>
                    Download
                    <Download className="ml-1 w-4 h-4" />
                  </>
                )}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ResourcesPage;
