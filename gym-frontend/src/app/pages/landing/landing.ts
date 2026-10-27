import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-landing',
  styleUrl: './landing.css',
  templateUrl: './landing.html',
})
export class Landing {
  readonly currentYear = new Date().getFullYear();

  readonly features = [
    {
      icon: '01',
      title: 'Modern equipment',
      description: 'Train with premium strength and cardio equipment built for every level.',
    },
    {
      icon: '02',
      title: 'Expert trainers',
      description: 'Get guidance from coaches who keep your form sharp and your goals in reach.',
    },
    {
      icon: '03',
      title: '24/7 access',
      description: 'Make your workout fit your life with access whenever motivation hits.',
    },
    {
      icon: '04',
      title: 'Nutrition tracking',
      description: 'Build better habits and keep your progress moving beyond the gym floor.',
    },
  ];

  readonly plans = [
    {
      name: 'Basic Plan',
      price: '₦15,000',
      description: 'Your foundation for a stronger, healthier routine.',
      features: ['Gym floor access', 'Modern equipment', 'Locker room access'],
      featured: false,
    },
    {
      name: 'Standard Plan',
      price: '₦25,000',
      description: 'More coaching and flexibility to keep you progressing.',
      features: ['Everything in Basic', 'Group fitness classes', 'Nutrition tracking'],
      featured: true,
    },
    {
      name: 'VIP Premium',
      price: '₦40,000',
      description: 'A complete, personalized experience built around you.',
      features: ['Everything in Standard', 'Personal training sessions', '24/7 gym access'],
      featured: false,
    },
  ];
}
