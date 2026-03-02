import React from 'react';
import { Calendar, MapPin, Video, FileText } from 'lucide-react';
import { upcomingEvents, pastEvents } from '../data/events';

function EventsPage() {

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950" data-testid="events-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">
            Events & Workshops
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-3xl">
            Speaking engagements, workshops, and community events focused on data engineering excellence.
          </p>
        </div>

        {/* Upcoming Events */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-6">
              {upcomingEvents.map((event, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 border border-cyan-200 dark:border-cyan-800 rounded-xl p-6"
                  data-testid={`upcoming-event-${index}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-3 py-1 bg-cyan-600 text-white text-xs font-medium rounded-full">
                          {event.type}
                        </span>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-xs font-medium rounded-full">
                          Upcoming
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{event.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-4 h-4" />
                          <span>{event.location}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300">{event.description}</p>
                    </div>
                    <a
                      href={event.registrationLink}
                      className="inline-flex items-center justify-center px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-lg whitespace-nowrap"
                    >
                      Register Now
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 dark:text-slate-400">No upcoming events at the moment. Check back soon!</p>
          )}
        </section>

        {/* Past Events */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Past Events</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {pastEvents.map((event, index) => (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 hover:shadow-lg"
                data-testid={`past-event-${index}`}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded-full">
                    {event.type}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {event.title}
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span>{event.location}</span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">{event.description}</p>
                <div className="flex flex-wrap gap-3">
                  {event.videoLink && (
                    <a
                      href={event.videoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium"
                    >
                      <Video className="w-4 h-4 mr-1" />
                      Watch Video
                    </a>
                  )}
                  {event.slidesLink && (
                    <a
                      href={event.slidesLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 text-sm font-medium"
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      View Slides
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default EventsPage;
