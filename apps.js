const express = require('express');
const router = express.Router();
const TourPackage = require('../models/TourPackage');

// GET all unique destinations
router.get('/', async (req, res) => {
  try {
    const destinations = await TourPackage.distinct('destination');
    // Get additional info for each destination
    const destinationsWithInfo = await Promise.all(
      destinations.map(async (destination) => {
        const packages = await TourPackage.find({ destination })
          .select('title price duration images')
          .limit(1);
        
        return {
          name: destination,
          packageCount: await TourPackage.countDocuments({ destination }),
          samplePackage: packages[0] || null
        };
      })
    );
    
    res.json(destinationsWithInfo);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// GET packages by destination
router.get('/:destination/packages', async (req, res) => {
  try {
    const { minPrice, maxPrice, duration } = req.query;
    
    const filter = {
      destination: { $regex: req.params.destination, $options: 'i' }
    };
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    if (duration) {
      filter.duration = { $regex: duration, $options: 'i' };
    }
    
    const packages = await TourPackage.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages by destination:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// GET destination statistics
router.get('/:destination/stats', async (req, res) => {
  try {
    const destination = req.params.destination;
    
    const stats = await TourPackage.aggregate([
      { $match: { destination: { $regex: destination, $options: 'i' } } },
      {
        $group: {
          _id: null,
          totalPackages: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          durations: { $addToSet: '$duration' }
        }
      }
    ]);
    
    if (stats.length === 0) {
      return res.status(404).json({ error: 'Destination not found' });
    }
    
    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching destination stats:', error);
    res.status(500).json({ error: 'Failed to fetch destination statistics' });
  }
});

module.exports = router;
