﻿using System.Collections.Generic;
using System.Linq;
using GeoJSON.Net.Feature;
using GeoJSON.Net.Geometry;
using IsraelHiking.API.Gpx.GpxTypes;
using IsraelHiking.Common;

namespace IsraelHiking.API.Converters
{
    public class GpxGeoJsonConverter : IGpxGeoJsonConverter
    {
        private const string NAME = "name";

        public FeatureCollection ToGeoJson(gpxType gpx)
        {
            var collection = new FeatureCollection();
            var points = gpx.wpt ?? new wptType[0];
            var pointsFeatures = points.Select(point => new Feature(new Point(CreateGeoPosition(point)), CreateNameProperties(point.name)));
            collection.Features.AddRange(pointsFeatures);

            var routes = gpx.rte ?? new rteType[0];
            var routesFeatures = routes.Select(route => new Feature(new LineString(route.rtept.Select(CreateGeoPosition)), CreateNameProperties(route.name)));
            collection.Features.AddRange(routesFeatures);

            foreach (var track in gpx.trk ?? new trkType[0])
            {
                if (track.trkseg.Length == 1)
                {
                    var lineStringFeature = new Feature(new LineString(track.trkseg[0].trkpt.Select(CreateGeoPosition)), CreateNameProperties(track.name));
                    collection.Features.Add(lineStringFeature);
                    continue;
                }
                var lineStringList = track.trkseg.Select(segment => new LineString(segment.trkpt.Select(CreateGeoPosition))).ToList();
                var feature = new Feature(new MultiLineString(lineStringList), CreateMultiLineProperties(track.name));
                collection.Features.Add(feature);
            }
            return collection;        
        }

        public gpxType ToGpx(FeatureCollection collection)
        {
            return new gpxType
            {
                creator = DataContainer.ISRAEL_HIKING_MAP,
                wpt = collection.Features.Where(f => f.Geometry is Point).Select(CreateWayPoint).ToArray(),
                rte = collection.Features.Where(f => f.Geometry is LineString).Select(CreateRoute).ToArray(),
                trk = collection.Features.Where(f => f.Geometry is MultiLineString).Select(CreateTrack).ToArray(),
            };
        }

        private GeographicPosition CreateGeoPosition(wptType wayPoint)
        {
            double lat = (double)wayPoint.lat;
            double lon = (double)wayPoint.lon;
            double? ele = wayPoint.eleSpecified ? (double?) wayPoint.ele : null;
            return new GeographicPosition(lat, lon, ele);
        }

        private wptType CreateWayPoint(Feature pointFeature)
        {
            var point = (Point) pointFeature.Geometry;
            var position = (GeographicPosition) point.Coordinates;
            return CreateWayPoint(position, GetFeatureName(pointFeature));
        }

        private wptType CreateWayPoint(GeographicPosition position, string name)
        {
            return new wptType
            {
                lat = (decimal)position.Latitude,
                lon = (decimal)position.Longitude,
                ele = (decimal)(position.Altitude ?? 0),
                eleSpecified = position.Altitude.HasValue,
                name = name,
            };
        }

        private rteType CreateRoute(Feature lineStringFeature)
        {
            var lineString = lineStringFeature.Geometry as LineString;

            return new rteType
            {
                name = GetFeatureName(lineStringFeature),
                rtept = lineString?.Coordinates.OfType<GeographicPosition>().Select(p => CreateWayPoint(p, null)).ToArray()
                
            };
        }

        private trkType CreateTrack(Feature multiLineStringFeature)
        {
            var multiLineString = multiLineStringFeature.Geometry as MultiLineString;
            return new trkType
            {
                name = GetFeatureName(multiLineStringFeature),
                trkseg = multiLineString?.Coordinates.Select(
                    ls => new trksegType
                    {
                        trkpt = ls.Coordinates.OfType<GeographicPosition>()
                            .Select(p => CreateWayPoint(p, null))
                            .ToArray()
                    }).ToArray()
            };
        }

        private Dictionary<string, object> CreateNameProperties(string name)
        {
            return new Dictionary<string, object> {{NAME, name}};
        }

        private Dictionary<string, object> CreateMultiLineProperties(string name)
        {
            return new Dictionary<string, object> { { NAME, name }, { "Creator",  DataContainer.ISRAEL_HIKING_MAP} };
        }

        private string GetFeatureName(Feature feature)
        {
            return feature.Properties.ContainsKey(NAME) ? feature.Properties[NAME].ToString() : string.Empty;
        }
    }
}