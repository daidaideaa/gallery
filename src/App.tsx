import { useEffect, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  Camera,
  Compass,
  Grid3X3,
  Heart,
  Info,
  MapPin,
  Moon,
  Sun,
  X,
  type LucideIcon,
} from 'lucide-react'
import './App.css'

type GalleryImage = {
  url: string
  width: number
  height: number
  alt: string
}

type PhotoCredit = {
  artist: string
  license: string
  sourceUrl: string
}

type Photo = {
  id: string
  title: string
  description: string
  author: string
  takenAt: string
  location: string
  image: GalleryImage
  credit?: PhotoCredit
}

type GalleryResponse = {
  photos: Photo[]
}

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; photos: Photo[] }
  | { status: 'empty' }
  | { status: 'error'; message: string }

type Theme = 'light' | 'dark'
type View = 'gallery' | 'shenzhen' | 'about'

const navItems: Array<{ label: string; view: View; icon: LucideIcon }> = [
  { label: 'Gallery', view: 'gallery', icon: Grid3X3 },
  { label: 'Shenzhen', view: 'shenzhen', icon: Compass },
  { label: 'About', view: 'about', icon: Info },
]

function resolveImageUrl(url: string) {
  if (/^https?:\/\//.test(url)) return url

  return `${import.meta.env.BASE_URL}${url.replace(/^\/+/, '')}`
}

function App() {
  const [gallery, setGallery] = useState<LoadState>({ status: 'loading' })
  const [activeView, setActiveView] = useState<View>('gallery')
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null)
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    if (!selectedPhoto) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedPhoto(null)
    }

    window.addEventListener('keydown', closeOnEscape)

    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [selectedPhoto])

  useEffect(() => {
    const controller = new AbortController()

    async function loadGallery() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/gallery.json`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`Gallery data returned ${response.status}`)
        }

        const data = (await response.json()) as GalleryResponse

        if (data.photos.length === 0) {
          setGallery({ status: 'empty' })
          return
        }

        setGallery({ status: 'ready', photos: data.photos })
      } catch (error) {
        if (controller.signal.aborted) return

        setGallery({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Could not load gallery data',
        })
      }
    }

    loadGallery()

    return () => controller.abort()
  }, [])

  const toggleTheme = () =>
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))

  return (
    <main className="app-shell">
      <header className="topbar" aria-label="Site header">
        <a className="brand" href={import.meta.env.BASE_URL}>
          <span className="brand-mark">d</span>
          <span className="brand-name">daidaide</span>
        </a>
        <button
          className="icon-button"
          type="button"
          aria-label="Toggle color theme"
          onClick={toggleTheme}
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </header>

      <div className="page-frame">
        <aside className="sidebar" aria-label="Gallery navigation">
          <nav className="nav-list">
            {navItems.map((item) => (
              <NavButton
                isActive={activeView === item.view}
                item={item}
                key={item.view}
                onSelect={() => setActiveView(item.view)}
              />
            ))}
          </nav>

          <div className="sidebar-card">
            <div className="mini-avatar">d</div>
            <div>
              <strong>daidaide</strong>
              <p>Guangdong Shenzhen</p>
            </div>
          </div>
        </aside>

        <section className="content" aria-live="polite">
          {gallery.status === 'loading' && (
            <StatePanel>
              <span className="loader" aria-hidden="true" />
              <p>Loading gallery...</p>
            </StatePanel>
          )}

          {gallery.status === 'empty' && (
            <StatePanel>
              <p>No photos found.</p>
            </StatePanel>
          )}

          {gallery.status === 'error' && (
            <StatePanel isError>
              <p>{gallery.message}</p>
            </StatePanel>
          )}

          {gallery.status === 'ready' && (
            <ViewContent
              activeView={activeView}
              onOpenPhoto={setSelectedPhoto}
              photos={gallery.photos}
            />
          )}
        </section>
      </div>

      <nav className="mobile-nav" aria-label="Mobile gallery navigation">
        {navItems.map((item) => (
          <NavButton
            isActive={activeView === item.view}
            item={item}
            key={item.view}
            onSelect={() => setActiveView(item.view)}
            variant="mobile"
          />
        ))}
      </nav>

      {selectedPhoto && (
        <PhotoModal
          onClose={() => setSelectedPhoto(null)}
          photo={selectedPhoto}
        />
      )}
    </main>
  )
}

function NavButton({
  isActive,
  item,
  onSelect,
  variant = 'sidebar',
}: {
  isActive: boolean
  item: { label: string; icon: LucideIcon }
  onSelect: () => void
  variant?: 'sidebar' | 'mobile'
}) {
  const Icon = item.icon
  const className =
    variant === 'mobile'
      ? isActive
        ? 'mobile-nav-item active'
        : 'mobile-nav-item'
      : isActive
        ? 'nav-item active'
        : 'nav-item'

  return (
    <button
      aria-pressed={isActive}
      className={className}
      onClick={onSelect}
      type="button"
    >
      <Icon size={variant === 'mobile' ? 21 : 22} />
      <span>{item.label}</span>
    </button>
  )
}

function ViewContent({
  activeView,
  onOpenPhoto,
  photos,
}: {
  activeView: View
  onOpenPhoto: (photo: Photo) => void
  photos: Photo[]
}) {
  if (activeView === 'about') {
    return <AboutView photoCount={photos.length} />
  }

  if (activeView === 'shenzhen') {
    return <ShenzhenView onOpenPhoto={onOpenPhoto} photos={photos} />
  }

  return <GalleryView onOpenPhoto={onOpenPhoto} photos={photos} />
}

function GalleryView({
  onOpenPhoto,
  photos,
}: {
  onOpenPhoto: (photo: Photo) => void
  photos: Photo[]
}) {
  return (
    <div className="view-stack">
      <GalleryHeader photoCount={photos.length} />
      <PhotoGrid onOpenPhoto={onOpenPhoto} photos={photos} />
    </div>
  )
}

function ShenzhenView({
  onOpenPhoto,
  photos,
}: {
  onOpenPhoto: (photo: Photo) => void
  photos: Photo[]
}) {
  const latestPhoto = photos[0]

  return (
    <div className="view-stack">
      <section className="city-hero">
        <p className="section-kicker">Guangdong Shenzhen</p>
        <h1>广东深圳的光，先存这 12 格</h1>
        <p>
          海风、玻璃幕墙、地铁站台和一点夜色；这座城市很会把普通一天拍得像正在发生什么。
        </p>
      </section>
      <div className="summary-row">
        <SummaryCard icon={Camera} label="Photos" value={`${photos.length}`} />
        <SummaryCard icon={MapPin} label="Location" value="广东深圳" />
        <SummaryCard
          icon={CalendarDays}
          label="Latest"
          value={latestPhoto?.takenAt ?? '-'}
        />
      </div>
      <PhotoGrid compact onOpenPhoto={onOpenPhoto} photos={photos} />
    </div>
  )
}

function AboutView({ photoCount }: { photoCount: number }) {
  return (
    <div className="view-stack">
      <section className="about-card">
        <div className="profile-avatar">d</div>
        <p className="section-kicker">About daidaide</p>
        <h1>会把城市边角认真看一遍的人</h1>
        <p>
          daidaide 可能会在深圳湾看云，在华强北看招牌，在地铁口研究光线；这个小站先收留
          {photoCount} 张城市切片，等它们慢慢长成自己的相册。
        </p>
        <div className="about-lines" aria-label="Gallery notes">
          <p>喜欢海边的风，也喜欢玻璃楼反出来的天。</p>
          <p>看到好看的路牌、窗户和傍晚，会忍不住停两秒。</p>
          <p>照片不急着讲大道理，先把那一刻放在这里。</p>
        </div>
      </section>
    </div>
  )
}

function GalleryHeader({ photoCount }: { photoCount: number }) {
  return (
    <section className="profile-header">
      <div className="profile-avatar">d</div>
      <div className="profile-copy">
        <div className="profile-title-row">
          <h1>daidaide</h1>
          <span>广东深圳</span>
        </div>
        <div className="profile-stats" aria-label="Gallery statistics">
          <strong>{photoCount}</strong>
          <span>photos</span>
          <strong>1</strong>
          <span>city</span>
          <strong>2026</strong>
          <span>year</span>
        </div>
        <p>City notes from 广东深圳: skyline, sea wind, neon, and platforms.</p>
      </div>
    </section>
  )
}

function PhotoGrid({
  compact = false,
  onOpenPhoto,
  photos,
}: {
  compact?: boolean
  onOpenPhoto: (photo: Photo) => void
  photos: Photo[]
}) {
  return (
    <div className={compact ? 'photo-grid compact' : 'photo-grid'}>
      {photos.map((photo) => (
        <button
          aria-label={`Open ${photo.title}`}
          className="photo-tile"
          key={photo.id}
          onClick={() => onOpenPhoto(photo)}
          type="button"
        >
          <img
            alt={photo.image.alt}
            height={photo.image.height}
            src={resolveImageUrl(photo.image.url)}
            width={photo.image.width}
          />
          <span className="photo-tile-overlay">
            <Heart size={18} />
            {photo.title}
          </span>
        </button>
      ))}
    </div>
  )
}

function PhotoModal({
  onClose,
  photo,
}: {
  onClose: () => void
  photo: Photo
}) {
  return (
    <div
      aria-labelledby="photo-modal-title"
      aria-modal="true"
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
    >
      <article className="photo-modal" onClick={(event) => event.stopPropagation()}>
        <button
          aria-label="Close photo"
          className="modal-close"
          onClick={onClose}
          type="button"
        >
          <X size={22} />
        </button>
        <img
          alt={photo.image.alt}
          height={photo.image.height}
          src={resolveImageUrl(photo.image.url)}
          width={photo.image.width}
        />
        <section className="modal-details">
          <div>
            <p className="section-kicker">@{photo.author}</p>
            <h2 id="photo-modal-title">{photo.title}</h2>
            <p>{photo.description}</p>
            {photo.credit && (
              <p className="photo-credit">
                Photo:{' '}
                <a
                  href={photo.credit.sourceUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  {photo.credit.artist}
                </a>{' '}
                · {photo.credit.license}
              </p>
            )}
          </div>
          <dl>
            <div>
              <dt>Date</dt>
              <dd>{photo.takenAt}</dd>
            </div>
            <div>
              <dt>Location</dt>
              <dd>{photo.location}</dd>
            </div>
          </dl>
        </section>
      </article>
    </div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <section className="summary-card">
      <Icon size={20} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </section>
  )
}

function StatePanel({
  children,
  isError = false,
}: {
  children: ReactNode
  isError?: boolean
}) {
  return (
    <div className={isError ? 'state-panel state-panel-error' : 'state-panel'}>
      {children}
    </div>
  )
}

export default App
