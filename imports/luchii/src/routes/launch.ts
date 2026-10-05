// Global Launch Routes
import { Router } from 'express';

const router = Router();

const launchPackage = {
  announcement: {
    title: 'Frasberg Autonomous Cloud Global Launch',
    tagline: 'The self-driving AI cloud for enterprises.',
    date: new Date('2026-08-15').toISOString(),
  },
  keynote: {
    title: 'Frasberg Autonomous Cloud — The Self-Driving AI Cloud',
    outline: [
      'Why autonomous clouds matter now',
      'Architecture and global brain',
      'Enterprise guarantees and SLAs',
      'Live demo of autonomous recovery',
      'Tiering and commercial availability',
      'Roadmap and vision',
    ],
    duration: '60 minutes',
  },
  website: {
    sections: [
      'Home/Hero',
      'Capabilities',
      'Tiers and Pricing',
      'Architecture',
      'Enterprise',
      'Status',
      'Docs',
      'Partners',
    ],
    liveAt: new Date('2026-08-15').toISOString(),
  },
  pressKit: {
    assets: ['logo-horizontal', 'logo-vertical', 'product-screenshots', 'architecture-diagrams', 'sla-fact-sheet'],
    contactEmail: 'press@frasberg.ai',
  },
  partnerAnnouncements: {
    template: '/launch/partner-template.md',
    embargoDate: new Date('2026-08-15').toISOString(),
    channels: ['press', 'social', 'email', 'blog'],
  },
  timeline: {
    preLaunch: {
      'T-7d': 'Partner briefings',
      'T-3d': 'Marketing campaign start',
      'T-1d': 'Site staging QA',
    },
    launchDay: {
      '9:00 AM': 'Livestream starts',
      '9:30 AM': 'Keynote presentation',
      '10:30 AM': 'Site goes live',
      '11:00 AM': 'Partner announcements',
    },
    postLaunch: {
      '+1d': 'Case studies published',
      '+7d': 'Webinar series begins',
      '+14d': 'First customer wins announced',
    },
  },
};

router.get('/', (req, res) => {
  res.json(launchPackage);
});

router.get('/keynote', (req, res) => {
  res.json({
    title: launchPackage.keynote.title,
    outline: launchPackage.keynote.outline,
    scriptUrl: '/launch/keynote-script.md',
  });
});

router.get('/website-structure', (req, res) => {
  res.json(launchPackage.website);
});

router.get('/press-kit', (req, res) => {
  res.json(launchPackage.pressKit);
});

router.get('/timeline', (req, res) => {
  res.json(launchPackage.timeline);
});

export default router;
