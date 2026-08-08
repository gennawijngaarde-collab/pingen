'use client';

import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Marie Dubois',
    role: 'Créatrice de contenu',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
    content:
      'PinGen a complètement transformé ma stratégie Pinterest. Je gagne 10 heures par semaine et mes vues ont augmenté de 400% en 2 mois.',
    rating: 5,
  },
  {
    name: 'Thomas Martin',
    role: 'E-commerce Entrepreneur',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    content:
      'L\'automatisation des Pins a été un game-changer pour mon business. Le trafic depuis Pinterest représente maintenant 30% de mes ventes.',
    rating: 5,
  },
  {
    name: 'Sophie Bernard',
    role: 'Marketing Manager',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
    content:
      'Nous gérons 5 comptes Pinterest pour nos clients. PinGen nous fait économiser des dizaines d\'heures chaque mois. Indispensable !',
    rating: 5,
  },
  {
    name: 'Lucas Petit',
    role: 'Influenceur Lifestyle',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
    content:
      'La génération IA est incroyable. Je crée des Pins professionnels en quelques secondes. Mon audience a doublé en 3 mois.',
    rating: 5,
  },
  {
    name: 'Emma Richard',
    role: 'Blogueuse Food',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=face',
    content:
      'Je pensais que Pinterest était trop chronophage. PinGen a changé ça. Maintenant je publie 3x plus avec 10x moins d\'effort.',
    rating: 5,
  },
  {
    name: 'Alexandre Moreau',
    role: 'Agence Digital',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    content:
      'Nous recommandons PinGen à tous nos clients. Le ROI est exceptionnel et le support client est réactif et compétent.',
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Témoignages
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Ils adorent PinGen
          </h2>
          <p className="text-lg text-muted-foreground">
            Rejoignez des milliers de créateurs et d\'entrepreneurs qui 
            transforment leur présence Pinterest avec PinGen.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl p-6 lg:p-8 border hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <Quote className="w-8 h-8 text-primary/20" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground leading-relaxed mb-6">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-foreground">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="mt-16 lg:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { value: '50K+', label: 'Utilisateurs actifs' },
            { value: '2M+', label: 'Pins créés' },
            { value: '4.9/5', label: 'Note moyenne' },
            { value: '300%', label: 'Croissance moyenne' },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-3xl lg:text-4xl font-bold text-primary mb-2">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
