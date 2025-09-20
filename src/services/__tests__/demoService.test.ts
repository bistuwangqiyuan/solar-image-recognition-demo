import { describe, it, expect } from 'vitest';
import { demoService } from '@/services/demoService';
import { PanelCondition } from '@/types';

describe('DemoService', () => {
  describe('getAllDemos', () => {
    it('should return all demo data', () => {
      const demos = demoService.getAllDemos();
      
      expect(demos).toBeDefined();
      expect(Array.isArray(demos)).toBe(true);
      expect(demos.length).toBeGreaterThan(0);
      
      // Check structure of first demo
      const firstDemo = demos[0];
      expect(firstDemo).toHaveProperty('id');
      expect(firstDemo).toHaveProperty('title');
      expect(firstDemo).toHaveProperty('description');
      expect(firstDemo).toHaveProperty('imageUrl');
      expect(firstDemo).toHaveProperty('category');
      expect(firstDemo).toHaveProperty('expectedResults');
    });
  });

  describe('getDemoById', () => {
    it('should return demo by id', () => {
      const demos = demoService.getAllDemos();
      const firstDemo = demos[0];
      
      const foundDemo = demoService.getDemoById(firstDemo.id);
      
      expect(foundDemo).toBeDefined();
      expect(foundDemo?.id).toBe(firstDemo.id);
      expect(foundDemo?.title).toBe(firstDemo.title);
    });

    it('should return undefined for non-existent id', () => {
      const foundDemo = demoService.getDemoById('non-existent-id');
      
      expect(foundDemo).toBeUndefined();
    });
  });

  describe('getDemosByCategory', () => {
    it('should return demos by category', () => {
      const normalDemos = demoService.getDemosByCategory(PanelCondition.NORMAL);
      
      expect(normalDemos).toBeDefined();
      expect(Array.isArray(normalDemos)).toBe(true);
      
      // All returned demos should have the correct category
      normalDemos.forEach(demo => {
        expect(demo.category).toBe(PanelCondition.NORMAL);
      });
    });

    it('should return empty array for non-existent category', () => {
      const demos = demoService.getDemosByCategory('non-existent' as PanelCondition);
      
      expect(demos).toBeDefined();
      expect(Array.isArray(demos)).toBe(true);
      expect(demos.length).toBe(0);
    });
  });

  describe('getRandomDemo', () => {
    it('should return a random demo', () => {
      const randomDemo = demoService.getRandomDemo();
      
      expect(randomDemo).toBeDefined();
      expect(randomDemo).toHaveProperty('id');
      expect(randomDemo).toHaveProperty('title');
      expect(randomDemo).toHaveProperty('description');
      expect(randomDemo).toHaveProperty('imageUrl');
      expect(randomDemo).toHaveProperty('category');
      expect(randomDemo).toHaveProperty('expectedResults');
    });

    it('should return different demos on multiple calls', () => {
      const demos = new Set();
      
      // Call multiple times to increase chance of getting different demos
      for (let i = 0; i < 10; i++) {
        demos.add(demoService.getRandomDemo().id);
      }
      
      // If we have multiple demos, we should get different ones
      const allDemos = demoService.getAllDemos();
      if (allDemos.length > 1) {
        expect(demos.size).toBeGreaterThan(1);
      }
    });
  });

  describe('searchDemos', () => {
    it('should search demos by title', () => {
      const demos = demoService.getAllDemos();
      const firstDemo = demos[0];
      
      const searchResults = demoService.searchDemos(firstDemo.title);
      
      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].id).toBe(firstDemo.id);
    });

    it('should search demos by description', () => {
      const demos = demoService.getAllDemos();
      const firstDemo = demos[0];
      
      // Search by part of description
      const searchTerm = firstDemo.description.split(' ')[0];
      const searchResults = demoService.searchDemos(searchTerm);
      
      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
    });

    it('should search demos by category', () => {
      const searchResults = demoService.searchDemos('正常');
      
      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
      
      // All results should contain the search term in some way
      searchResults.forEach(demo => {
        const searchLower = '正常'.toLowerCase();
        const titleLower = demo.title.toLowerCase();
        const descLower = demo.description.toLowerCase();
        const categoryLower = demo.category.toLowerCase();
        
        expect(
          titleLower.includes(searchLower) ||
          descLower.includes(searchLower) ||
          categoryLower.includes(searchLower)
        ).toBe(true);
      });
    });

    it('should return empty array for non-matching search', () => {
      const searchResults = demoService.searchDemos('non-existent-search-term');
      
      expect(searchResults).toBeDefined();
      expect(Array.isArray(searchResults)).toBe(true);
      expect(searchResults.length).toBe(0);
    });

    it('should be case insensitive', () => {
      const demos = demoService.getAllDemos();
      const firstDemo = demos[0];
      
      const upperCaseResults = demoService.searchDemos(firstDemo.title.toUpperCase());
      const lowerCaseResults = demoService.searchDemos(firstDemo.title.toLowerCase());
      
      expect(upperCaseResults.length).toBe(lowerCaseResults.length);
    });
  });

  describe('getDemoStatistics', () => {
    it('should return correct statistics', () => {
      const stats = demoService.getDemoStatistics();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('byCategory');
      expect(stats).toHaveProperty('averageConfidence');
      
      expect(typeof stats.total).toBe('number');
      expect(stats.total).toBeGreaterThan(0);
      
      expect(typeof stats.byCategory).toBe('object');
      expect(typeof stats.averageConfidence).toBe('number');
      expect(stats.averageConfidence).toBeGreaterThan(0);
      expect(stats.averageConfidence).toBeLessThanOrEqual(1);
    });

    it('should have correct total count', () => {
      const stats = demoService.getDemoStatistics();
      const allDemos = demoService.getAllDemos();
      
      expect(stats.total).toBe(allDemos.length);
    });

    it('should have correct category counts', () => {
      const stats = demoService.getDemoStatistics();
      const allDemos = demoService.getAllDemos();
      
      // Count demos by category manually
      const manualCounts: Record<PanelCondition, number> = {
        [PanelCondition.NORMAL]: 0,
        [PanelCondition.LEAVES]: 0,
        [PanelCondition.DUST]: 0,
        [PanelCondition.SHADOW]: 0,
        [PanelCondition.OTHER]: 0,
      };
      
      allDemos.forEach(demo => {
        manualCounts[demo.category]++;
      });
      
      // Compare with stats
      Object.keys(manualCounts).forEach(category => {
        expect(stats.byCategory[category as PanelCondition]).toBe(manualCounts[category as PanelCondition]);
      });
    });
  });

  describe('getRecommendedDemos', () => {
    it('should return recommended demos', () => {
      const recommended = demoService.getRecommendedDemos(3);
      
      expect(recommended).toBeDefined();
      expect(Array.isArray(recommended)).toBe(true);
      expect(recommended.length).toBeLessThanOrEqual(3);
      
      recommended.forEach(demo => {
        expect(demo).toHaveProperty('id');
        expect(demo).toHaveProperty('title');
        expect(demo).toHaveProperty('description');
        expect(demo).toHaveProperty('imageUrl');
        expect(demo).toHaveProperty('category');
        expect(demo).toHaveProperty('expectedResults');
      });
    });

    it('should return demos sorted by confidence', () => {
      const recommended = demoService.getRecommendedDemos(5);
      
      if (recommended.length > 1) {
        // Check if demos are sorted by average confidence (descending)
        for (let i = 0; i < recommended.length - 1; i++) {
          const currentAvg = recommended[i].expectedResults.reduce((sum, r) => sum + r.confidence, 0) / recommended[i].expectedResults.length;
          const nextAvg = recommended[i + 1].expectedResults.reduce((sum, r) => sum + r.confidence, 0) / recommended[i + 1].expectedResults.length;
          
          expect(currentAvg).toBeGreaterThanOrEqual(nextAvg);
        }
      }
    });

    it('should respect limit parameter', () => {
      const limit = 2;
      const recommended = demoService.getRecommendedDemos(limit);
      
      expect(recommended.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('getCategories', () => {
    it('should return categories with correct structure', () => {
      const categories = demoService.getCategories();
      
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      
      categories.forEach(category => {
        expect(category).toHaveProperty('category');
        expect(category).toHaveProperty('count');
        expect(category).toHaveProperty('label');
        
        expect(typeof category.count).toBe('number');
        expect(category.count).toBeGreaterThan(0);
        expect(typeof category.label).toBe('string');
        expect(category.label.length).toBeGreaterThan(0);
      });
    });

    it('should have correct category counts', () => {
      const categories = demoService.getCategories();
      const stats = demoService.getDemoStatistics();
      
      categories.forEach(category => {
        expect(category.count).toBe(stats.byCategory[category.category]);
      });
    });

    it('should have all expected categories', () => {
      const categories = demoService.getCategories();
      const categoryValues = categories.map(c => c.category);
      
      const expectedCategories = Object.values(PanelCondition);
      expectedCategories.forEach(expectedCategory => {
        expect(categoryValues).toContain(expectedCategory);
      });
    });
  });
});
