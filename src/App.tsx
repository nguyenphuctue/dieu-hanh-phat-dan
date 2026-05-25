import Feature from 'ol/Feature'
import { Style, Stroke, Circle, Fill, Text } from 'ol/style'
import { useEffect, useRef, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import { defaults as defaultControls } from 'ol/control'
import Overlay from 'ol/Overlay'
import Point from 'ol/geom/Point'
import Geolocation from 'ol/Geolocation'
import 'ol/ol.css'
import './App.css'
import { getRouteLine, getRouteArrows, getRoutePoints, routePoints } from './route-data'

function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const startPopupRef = useRef<HTMLDivElement>(null)
  const endPopupRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<Map | null>(null)
  const vectorSourceRef = useRef<VectorSource | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(true)
  const [selectedId, setSelectedId] = useState(-1)
  const [hasPosition, setHasPosition] = useState(false)
  const positionRef = useRef<number[] | null>(null)
  const firstFixRef = useRef(true)

  useEffect(() => {
    if (!mapRef.current) return

    const line = getRouteLine()
    const arrows = getRouteArrows()
    const features = line ? [line, ...arrows, ...getRoutePoints()] : []
    const vectorSource = new VectorSource({ features })
    vectorSourceRef.current = vectorSource
    const vectorLayer = new VectorLayer({ source: vectorSource })

    const popup = new Overlay({
      element: popupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: true,
    })

    const startPopup = new Overlay({
      element: startPopupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: false,
    })

    const endPopup = new Overlay({
      element: endPopupRef.current!,
      positioning: 'bottom-center',
      offset: [0, -10],
      autoPan: false,
    })



    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center: fromLonLat([105.94, 21.03]),
        zoom: 12,
        minZoom: 6,
      }),
      controls: defaultControls({ zoom: true, rotate: false }),
      overlays: [popup, startPopup, endPopup],
    })

    mapInstanceRef.current = map

    const geolocation = new Geolocation({
      tracking: true,
      trackingOptions: { enableHighAccuracy: true },
      projection: map.getView().getProjection(),
    })

    const positionFeature = new Feature()
    positionFeature.setStyle(
      new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#4285F4' }),
          stroke: new Stroke({ color: '#fff', width: 3 }),
        }),
      })
    )

    const accuracyFeature = new Feature()
    accuracyFeature.setStyle(
      new Style({
        fill: new Fill({ color: 'rgba(66, 133, 244, 0.15)' }),
        stroke: new Stroke({ color: 'rgba(66, 133, 244, 0.5)', width: 2 }),
      })
    )

    const geolocationSource = new VectorSource({ features: [accuracyFeature, positionFeature] })
    const geolocationLayer = new VectorLayer({ source: geolocationSource })
    map.addLayer(geolocationLayer)

    geolocation.on('change:position', () => {
      const coords = geolocation.getPosition()
      positionFeature.setGeometry(coords ? new Point(coords) : undefined)
      positionRef.current = coords ?? null
      setHasPosition(!!coords)
      if (coords && firstFixRef.current) {
        firstFixRef.current = false
        map.getView().animate({
          center: coords,
          zoom: 14,
          duration: 1000,
        })
      }
    })

    geolocation.on('change:accuracyGeometry', () => {
      accuracyFeature.setGeometry(geolocation.getAccuracyGeometry() || undefined)
    })

    if (routePoints.length > 0) {
      const first = routePoints[0]
      const last = routePoints[routePoints.length - 1]
      startPopup.setPosition(fromLonLat([first.lon, first.lat]))
      startPopupRef.current!.innerHTML = `<div class="route-popup route-popup-start">🏯 ${first.name}</div>`
      endPopup.setPosition(fromLonLat([last.lon, last.lat]))
      endPopupRef.current!.innerHTML = `<div class="route-popup route-popup-end">🏯 ${last.name}</div>`
    }

    map.on('click', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
      if (feature) {
        const name = feature.get('name')
        const id = feature.get('id')
        if (name !== undefined) {
          const isChua = name.toLowerCase().includes('chùa')
          popup.setPosition(evt.coordinate)
          popupRef.current!.innerHTML = `<div class="route-popup">${isChua ? '🏯 ' : ''}<strong>${id}.</strong> ${name}</div>`
          setSelectedId(id)
        }
      } else {
        popup.setPosition(undefined)
        setSelectedId(-1)
      }
    })

    map.on('pointermove', (evt) => {
      const hit = map.hasFeatureAtPixel(evt.pixel)
      mapRef.current!.style.cursor = hit ? 'pointer' : ''
    })

    return () => {
      geolocation.setTracking(false)
      map.setTarget(undefined!)
    }
  }, [])

  useEffect(() => {
    const source = vectorSourceRef.current
    if (!source) return

    source.forEachFeature(f => {
      const id = f.get('id')
      if (id === undefined) return
      const isSelected = id === selectedId
      const isStart = id === 0
      const isEnd = id === routePoints.length - 1
      const baseColor = isStart ? '#52c41a' : isEnd ? '#d4380d' : '#fa8c16'

      if (isSelected) {
        f.setStyle(
          new Style({
            image: new Circle({
              radius: 16,
              fill: new Fill({ color: '#fadb14' }),
              stroke: new Stroke({ color: '#d4380d', width: 4 }),
            }),
            text: new Text({
              text: `${id}`,
              font: 'bold 13px sans-serif',
              fill: new Fill({ color: '#333' }),
              stroke: new Stroke({ color: '#fff', width: 2 }),
              textAlign: 'center',
              textBaseline: 'middle',
            }),
          })
        )
      } else {
        f.setStyle(
          new Style({
            image: new Circle({
              radius: 11,
              fill: new Fill({ color: baseColor }),
              stroke: new Stroke({ color: '#fff', width: 3 }),
            }),
            text: new Text({
              text: isStart || isEnd ? '' : `${id}`,
              font: 'bold 10px sans-serif',
              fill: new Fill({ color: '#fff' }),
              stroke: new Stroke({ color: 'rgba(0,0,0,0.3)', width: 2 }),
              textAlign: 'center',
              textBaseline: 'middle',
            }),
          })
        )
      }
    })
  }, [selectedId])

  const handleLocate = () => {
    const coords = positionRef.current
    const map = mapInstanceRef.current
    if (coords && map) {
      map.getView().animate({
        center: coords,
        zoom: 15,
        duration: 500,
      })
    }
  }

  const handleSidebarClick = (p: typeof routePoints[0]) => {
    setSelectedId(p.id)
    const map = mapInstanceRef.current
    if (map) {
      map.getView().animate({
        center: fromLonLat([p.lon, p.lat]),
        zoom: 15,
        duration: 500,
      })
    }
  }

  return (
    <div className="app-container">
      <div className="app-header">
        <div className="header-side">
          <img src="/icon.png" alt="icon" className="header-icon" />
        </div>
        <div className="header-center">
          <h1 className="title-line1">SƠ ĐỒ LỘ TRÌNH XE HOA</h1>
          <h2 className="title-line2">LỄ CUNG RƯỚC PHẬT ĐẢN SINH</h2>
          <p className="title-line3">KÍNH MỪNG ĐẠI LỄ PHẬT ĐẢN SINH PL.2570 – DL.2026</p>
          <span className="header-time">14h00 – 16h00 · Thứ tư 27/5/2026 (11/4 Bính ngọ)</span>
        </div>
        <div className="header-side">
          <img src="/duc_phat.png" alt="Đức Phật" className="header-duc-phat" />
        </div>
      </div>
      <div className="app-body">
        <div className="map-container">
          <div ref={mapRef} className="ol-map" />
          <div ref={popupRef} />
          <div ref={startPopupRef} />
          <div ref={endPopupRef} />
          <div className="map-note-wrap" style={{ display: noteOpen ? 'block' : 'none' }}>
            <div className="map-note">
              <button className="map-note-close" onClick={() => setNoteOpen(false)}>×</button>
              <strong>GHI CHÚ:</strong><br />
              16h00: Chư Tôn đức Tăng Ni Ban Đại diện dâng hương đặt vòng hoa tại đài tưởng niệm anh hùng liệt sĩ xã Bát Tràng.<br /><br />
              Chiều Thứ sáu, ngày 29/5/2026 (13/4/Bính Ngọ), xe hoa của đơn vị liên xã Gia Lâm tập trung về Văn phòng điều hành công tác hành chính đạo – Ngã tư Đa Tốn, đường Giáp Hải, xã Bát Tràng (theo chương trình của BTS thành phố).
            </div>
          </div>
          {!sidebarOpen && <button className="sidebar-open-btn" onClick={() => setSidebarOpen(true)}>☰</button>}
          {!noteOpen && <button className="map-note-open" onClick={() => setNoteOpen(true)}>📋</button>}
          <button className={`locate-btn ${hasPosition ? '' : 'locate-btn-disabled'}`} onClick={handleLocate} title="Vị trí của tôi">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            </svg>
          </button>
        </div>
        <div className={`sidebar ${sidebarOpen ? '' : 'sidebar-closed'}`}>
          <div className="sidebar-title">
            <span>DANH SÁCH ĐIỂM</span>
            <button className="sidebar-title-close" onClick={() => setSidebarOpen(false)}>×</button>
          </div>
          <ul className="sidebar-list">
            {routePoints.map((p, i) => (
              <li key={p.id} className={`sidebar-item ${i === 0 ? 'start' : i === routePoints.length - 1 ? 'end' : ''} ${selectedId === p.id ? 'active' : ''}`} onClick={() => handleSidebarClick(p)}>
                <span className="sidebar-id">{i}.</span>
                <span className="sidebar-name">{i === 0 || i === routePoints.length - 1 ? '🏯 ' : ''}{p.name}</span>
              </li>
            ))}
          </ul>
          <div className="sidebar-info">
            <p className="sidebar-info-item">🚗 <strong>Phương tiện:</strong> 1 xe hoa + 5 xe ô tô 7 chỗ</p>
            <p className="sidebar-info-item">👥 <strong>Số người tham gia:</strong> 30 người</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
