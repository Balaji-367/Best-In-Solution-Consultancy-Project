import { useState, useRef, useEffect, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'

const containerStyle = {
  width: '100%',
  height: '100%',
}

const defaultCenter = { lat: 13.0827, lng: 80.2707 }

const LocationPicker = ({ initialLat, initialLng, onLocationSelect, onClose }) => {
  const center = initialLat && initialLng
    ? { lat: parseFloat(initialLat), lng: parseFloat(initialLng) }
    : defaultCenter

  const [markerPosition, setMarkerPosition] = useState(center)
  const [map, setMap] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef(null)
  const autocompleteRef = useRef(null)
  const searchInputRef = useRef(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  })

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isLoaded && searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode'],
      })

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace()
        if (place.geometry) {
          const location = place.geometry.location
          const newPosition = { lat: location.lat(), lng: location.lng() }
          setMarkerPosition(newPosition)
          if (map) {
            map.panTo(newPosition)
            map.setZoom(15)
          }
          setSearchQuery(place.formatted_address || place.name)
          setShowSuggestions(false)
          setSuggestions([])
        }
      })
    }
  }, [isLoaded, map])

  const onMapClick = useCallback((e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    })
  }, [])

  const onMarkerDragEnd = useCallback((e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    })
  }, [])

  const onLoad = useCallback((map) => {
    setMap(map)
  }, [])

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchQuery(value)

    if (!value.trim()) {
      setSuggestions([])
      return
    }

    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
      const service = new window.google.maps.places.AutocompleteService()
      service.getPlacePredictions(
        { input: value, types: ['geocode'] },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions)
            setShowSuggestions(true)
          } else {
            setSuggestions([])
          }
        }
      )
    }
  }

  const handleSelectSuggestion = (placeId, description) => {
    if (isLoaded && window.google && window.google.maps) {
      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'))
      placesService.getDetails(
        { placeId, fields: ['geometry', 'formatted_address', 'name'] },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
            const location = place.geometry.location
            const newPosition = { lat: location.lat(), lng: location.lng() }
            setMarkerPosition(newPosition)
            if (map) {
              map.panTo(newPosition)
              map.setZoom(15)
            }
            setSearchQuery(place.formatted_address || description)
          }
        }
      )
    }
    setShowSuggestions(false)
    setSuggestions([])
  }

  const handleSave = () => {
    onLocationSelect({
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
    })
    onClose()
  }

  if (loadError) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <h2 className="text-lg font-semibold">Pick Location on Map</h2>
            <button onClick={onClose} className="hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 text-center text-red-600">
            <p className="text-lg font-semibold mb-2">Failed to load Google Maps</p>
            <p className="text-sm">Please check your API key or internet connection.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
          <div className="bg-primary p-4 flex justify-between items-center text-white">
            <h2 className="text-lg font-semibold">Pick Location on Map</h2>
            <button onClick={onClose} className="hover:text-gray-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 text-center text-text-secondary">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>Loading map...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col" style={{ maxHeight: '90vh' }}>
        <div className="bg-primary p-4 flex justify-between items-center text-white rounded-t-xl flex-shrink-0">
          <h2 className="text-lg font-semibold">Pick Location on Map</h2>
          <button onClick={onClose} className="hover:text-gray-200">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-shrink-0">
          <div className="mb-3 relative" ref={searchRef}>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Search for a location
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search city, area, or address..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-[10000] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.place_id}
                    onClick={() => handleSelectSuggestion(suggestion.place_id, suggestion.description)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 truncate">
                        {suggestion.structured_formatting.main_text}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {suggestion.structured_formatting.secondary_text}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-sm text-text-secondary mb-3">
            Or click anywhere on the map to place the pin, or drag the marker to fine-tune.
          </p>
        </div>

        <div className="px-4 flex-shrink-0" style={{ height: '400px' }}>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            onClick={onMapClick}
            onLoad={onLoad}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              mapTypeControl: false,
              streetViewControl: false,
              fullscreenControl: true,
            }}
          >
            <Marker
              position={markerPosition}
              draggable={true}
              onDragEnd={onMarkerDragEnd}
            />
          </GoogleMap>
        </div>

        <div className="p-4 border-t border-border-light bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-text-secondary mb-1">Selected Coordinates</p>
              <p className="text-sm font-mono text-text-primary">
                {markerPosition.lat.toFixed(6)}, {markerPosition.lng.toFixed(6)}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Location
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LocationPicker
