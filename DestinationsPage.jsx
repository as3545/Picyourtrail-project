import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Package, DollarSign, Clock, Globe } from 'lucide-react'
import { useDestinations, useDestinationPackages } from '../hooks/useDestinations'
import LoadingSpinner from '../components/LoadingSpinner'
import PackageCard from '../components/PackageCard'

const DestinationsPage = () => {
  const { destinations, loading: destinationsLoading, error: destinationsError } = useDestinations()
  const [selectedDestination, setSelectedDestination] = useState('')
  const [destinationStats, setDestinationStats] = useState({})
  //
  const { 
    packages: destinationPackages, 
    loading: packagesLoading, 
    error: packagesError 
  } = useDestinationPackages(selectedDestination)

  // Calculate stats for each destination
  useEffect(() => {
    if (destinations && destinations.length > 0) {
      const stats = {}
      destinations.forEach(dest => {
        stats[dest.name] = {
          packageCount: dest.packageCount || 0,
          avgPrice: 0,
          minPrice: Infinity,
          maxPrice: 0,
          durations: []
        }
      })
      setDestinationStats(stats)
    }
  }, [destinations])

  if (destinationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (destinationsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Destinations</h2>
          <p className="text-gray-600 mb-4">{destinationsError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Handle empty destinations state
  if (!destinations || destinations.length === 0) {
    return (
      <div className="min-h-screen bg-secondary-50">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Destinations</h1>
              <p className="text-xl text-primary-100 max-w-2xl mx-auto">
                Discover amazing places around the world and find the perfect tour package for your next adventure
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <Globe className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">No Destinations Available</h2>
            <p className="text-gray-600 mb-6">
              Currently, there are no destinations available. Please check back later or contact us for more information.
            </p>
            <div className="space-y-3">
              <Link
                to="/packages"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                View All Packages
              </Link>
              <Link
                to="/contact"
                className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium ml-3"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Destinations</h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Discover amazing places around the world and find the perfect tour package for your next adventure
            </p>
          </div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations?.map(destination => (
            <DestinationCard
              key={destination.name}
              destination={destination}
              stats={destinationStats[destination.name]}
              onSelect={() => setSelectedDestination(destination.name)}
              isSelected={selectedDestination === destination.name}
            />
          ))}
        </div>
      </div>

      {/* Selected Destination Packages */}
      {selectedDestination && (
        <div className="bg-white border-t">
          <div className="container mx-auto px-4 py-12">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-4">
                Packages in {selectedDestination}
              </h2>
              <button
                onClick={() => setSelectedDestination('')}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Back to all destinations
              </button>
            </div>

            {packagesLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : packagesError ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Error Loading Packages</h3>
                <p className="text-gray-600">{packagesError}</p>
              </div>
            ) : destinationPackages && destinationPackages.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {destinationPackages.map(pkg => (
                  <PackageCard key={pkg._id} package={pkg} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">No packages found</h3>
                  <p className="text-gray-600 mb-4">
                    We don't have any packages available for {selectedDestination} at the moment.
                  </p>
                  <Link
                    to="/packages"
                    className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    View All Packages
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Call to Action */}
      {!selectedDestination && (
        <div className="bg-primary-600 text-white py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Browse our complete collection of tour packages and find the perfect adventure for your next trip.
            </p>
            <Link
              to="/packages"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors font-semibold text-lg"
            >
              View All Packages
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

// Destination Card Component
const DestinationCard = ({ destination, stats, onSelect, isSelected }) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border-2 transition-all cursor-pointer hover:shadow-md ${
        isSelected ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-primary-300'
      }`}
      onClick={onSelect}
    >
      <div className="p-6">
        <div className="flex items-center mb-4">
          <MapPin className="w-6 h-6 text-primary-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">{destination.name}</h3>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Packages</span>
            <span className="font-semibold text-gray-900">
              {destination.packageCount || 0}
            </span>
          </div>

          {destination.samplePackage && (
            <div className="flex items-center justify-between">
            <span className="text-gray-600">Starting from</span>
            <span className="font-semibold text-gray-900">
              ₹{destination.samplePackage.price?.toLocaleString() || 'N/A'}
            </span>
          </div>
          )}
        </div>

        <div className="mt-6">
          <button
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-primary-600 text-white'
                : 'bg-primary-100 text-primary-700 hover:bg-primary-200'
            }`}
          >
            {isSelected ? 'Selected' : 'View Packages'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DestinationsPage
