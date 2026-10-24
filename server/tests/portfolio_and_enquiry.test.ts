import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { ENV } from '../src/config/env';
import { PortfolioProject } from '../src/models/PortfolioProject';
import { ProjectIdea } from '../src/models/ProjectIdea';
import { Enquiry } from '../src/models/Enquiry';
import { Lead } from '../src/models/Lead';
import { INDIAN_PHONE_REGEX, ESTIMATION_DISCLAIMER_TEXT } from '../src/shared/constants';

import { connectTestDB, disconnectTestDB } from './testHelper';

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

describe('1. Public Portfolio Projects & RBL Content Exclusion', () => {
  it('should fetch published portfolio projects and confirm zero RBL mentions', async () => {
    const projects = await PortfolioProject.find({ isPublished: true }).lean();
    expect(projects.length).toBeGreaterThanOrEqual(5);

    // Verify absolutely no RBL Bank / RBL Private Ltd in any field
    for (const p of projects) {
      const fullText = JSON.stringify(p).toLowerCase();
      expect(fullText).not.toContain('rbl');
      expect(fullText).not.toContain('rbl bank');
      expect(fullText).not.toContain('rbl private');
    }
  });

  it('should verify Ginger Hotel project reflects authentic scope from company profile', async () => {
    const gingerProject = await PortfolioProject.findOne({ slug: 'ginger-hotel-specialized-civil-works' }).lean();
    expect(gingerProject).not.toBeNull();
    expect(gingerProject?.title).toContain('Ginger Hotel');
    expect(gingerProject?.category).toBe('renovation');
    expect(gingerProject?.categoryLabel).toBe('Hospitality-Related Civil Works');
    expect(gingerProject?.location).toContain('Navalur');
    expect(gingerProject?.isVerified).toBe(true);
    // Verified authentic client from profile: Roots Corporation Limited
    expect(gingerProject?.client).toBe('Roots Corporation Limited');
    // Authentic scope: water tank plastering, waterproofing, and civil finishing
    const workScopeText = Array.isArray(gingerProject?.workScope) 
      ? gingerProject?.workScope.join(' ').toLowerCase() 
      : String(gingerProject?.workScope || '').toLowerCase();
    expect(workScopeText).toContain('water tank');
    expect(workScopeText).toContain('plastering');
    expect(gingerProject?.description?.toLowerCase()).not.toContain('built the entire hotel');
  });

  it('should verify project records do not contain fabricated completion percentages', async () => {
    const projects = await PortfolioProject.find().lean();
    for (const p of projects) {
      // Must not contain fake progress metrics like "72% Completed"
      expect((p as any).completionPercentage).toBeUndefined();
      expect((p as any).progressPercent).toBeUndefined();
      expect(p.status).toBe('Completed');
    }
  });
});

describe('2. 50+ House Construction Ideas by Square Footage', () => {
  it('should contain at least 50 distinct, published project ideas', async () => {
    const totalIdeas = await ProjectIdea.countDocuments({ isPublished: true });
    expect(totalIdeas).toBeGreaterThanOrEqual(50);
  });

  it('should support filtering across all 8 square-footage categories', async () => {
    const categories = [
      'under_600',
      '600_800',
      '800_1000',
      '1000_1200',
      '1200_1500',
      '1500_2000',
      '2000_2500',
      'above_2500',
    ];

    for (const cat of categories) {
      const count = await ProjectIdea.countDocuments({ areaCategory: cat, isPublished: true });
      expect(count).toBeGreaterThan(0);
    }
  });

  it('should have required metadata, slug, features, and concept/actual labels', async () => {
    const ideas = await ProjectIdea.find({ isPublished: true }).limit(10).lean();
    for (const idea of ideas) {
      expect(idea.slug).toBeTruthy();
      expect(idea.title).toBeTruthy();
      expect(idea.features).toBeInstanceOf(Array);
      expect(idea.features.length).toBeGreaterThan(0);
      expect(idea.tags).toBeInstanceOf(Array);
      expect(['Concept Reference', 'Actual Project']).toContain(idea.contentType);
      expect(idea.images.length).toBeGreaterThan(0);
      expect(idea.images[0].alt).toBeTruthy();
    }
  });

  it('should filter by bedroom configuration and architectural style', async () => {
    const duplexModern = await ProjectIdea.find({
      propertyType: 'duplex',
      architecturalStyle: 'modern',
      isPublished: true,
    }).lean();
    expect(duplexModern.length).toBeGreaterThan(0);

    const traditionalHouses = await ProjectIdea.find({
      architecturalStyle: 'traditional',
      isPublished: true,
    }).lean();
    expect(traditionalHouses.length).toBeGreaterThan(0);
  });
});

describe('3. Enquiry & Site Visit Workflow Validation', () => {
  const indianPhoneRegex = /^(?:\+91|0)?[6-9]\d{9}$/;

  it('should validate Indian phone numbers correctly with regex', () => {
    const clean = (p: string) => p.replace(/[\s\-\(\)]/g, '');
    // Valid phone numbers
    expect(indianPhoneRegex.test(clean('9840123456'))).toBe(true);
    expect(indianPhoneRegex.test(clean('+919840123456'))).toBe(true);
    expect(indianPhoneRegex.test(clean('+91 98401 23456'))).toBe(true);
    expect(indianPhoneRegex.test(clean('09840123456'))).toBe(true);
    expect(indianPhoneRegex.test(clean('8838030917'))).toBe(true);

    // Invalid phone numbers
    expect(indianPhoneRegex.test(clean('123456'))).toBe(false);
    expect(indianPhoneRegex.test(clean('abcdefghij'))).toBe(false);
    expect(indianPhoneRegex.test(clean('1234567890'))).toBe(false); // Does not start with 6, 7, 8, or 9
  });

  it('should successfully create an enquiry and generate unique reference number', async () => {
    const year = new Date().getFullYear();
    const count = await Enquiry.countDocuments();
    const refNum = `GKA-TEST-${year}-${String(count + 1).padStart(4, '0')}`;

    const enquiry = await Enquiry.create({
      referenceNumber: refNum,
      customerName: 'Test Homeowner',
      phone: '+91 98401 23456',
      email: 'homeowner@example.com',
      preferredContactMethod: 'whatsapp',
      serviceType: 'new_residential',
      projectLocation: 'Anna Nagar, Chennai',
      builtUpAreaSqFt: 1800,
      projectType: 'new_construction',
      requirements: 'Need 3 BHK duplex house construction estimate on 30x40 plot.',
      relatedIdeaSlug: 'modern-1800-sqft-duplex-concept',
      relatedIdeaTitle: '1,800 Sq. Ft. Modern Duplex Concept',
      consent: true,
      status: 'new',
    });

    expect(enquiry._id).toBeDefined();
    expect(enquiry.referenceNumber).toBe(refNum);
    expect(enquiry.status).toBe('new');

    // Clean up test document
    await Enquiry.findByIdAndDelete(enquiry._id);
  });

  it('should verify pricing disclaimer text matches mandatory guidelines', () => {
    expect(ESTIMATION_DISCLAIMER_TEXT).toContain('Every project depends on plot dimensions');
    expect(ESTIMATION_DISCLAIMER_TEXT).toContain('material selection');
    expect(ESTIMATION_DISCLAIMER_TEXT).toContain('request a site visit');
  });
});
