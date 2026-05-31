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
  UserRound,
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

type Photo = {
  id: string
  title: string
  description: string
  author: string
  takenAt: string
  location: string
  image: GalleryImage
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
type View = 'gallery' | 'explore' | 'profile' | 'about'

const navItems: Array<{ label: string; view: View; icon: LucideIcon }> = [
  { label: 'Gallery', view: 'gallery', icon: Grid3X3 },
  { label: 'Explore', view: 'explore', icon: Compass },
  { label: 'Profile', view: 'profile', icon: UserRound },
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
          <span>daidaide</span>
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
              <p>personal visual archive</p>
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

  if (activeView === 'profile') {
    return (
      <ProfileView
        onOpenPhoto={onOpenPhoto}
        photoCount={photos.length}
        photos={photos}
      />
    )
  }

  if (activeView === 'explore') {
    return <ExploreView onOpenPhoto={onOpenPhoto} photos={photos} />
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
      <ProfileHeader photoCount={photos.length} />
      <PhotoGrid onOpenPhoto={onOpenPhoto} photos={photos} />
    </div>
  )
}

function ExploreView({
  onOpenPhoto,
  photos,
}: {
  onOpenPhoto: (photo: Photo) => void
  photos: Photo[]
}) {
  return (
    <div className="view-stack">
      <section className="view-heading">
        <p>Explore</p>
        <h1>Recent moments</h1>
      </section>
      <div className="summary-row">
        <SummaryCard icon={Camera} label="Photos" value={`${photos.length}`} />
        <SummaryCard
          icon={MapPin}
          label="Places"
          value={`${new Set(photos.map((photo) => photo.location)).size}`}
        />
        <SummaryCard
          icon={CalendarDays}
          label="Latest"
          value={photos[0]?.takenAt ?? '-'}
        />
      </div>
      <PhotoGrid compact onOpenPhoto={onOpenPhoto} photos={photos} />
    </div>
  )
}

function ProfileView({
  onOpenPhoto,
  photoCount,
  photos,
}: {
  onOpenPhoto: (photo: Photo) => void
  photoCount: number
  photos: Photo[]
}) {
  return (
    <div className="view-stack">
      <ProfileHeader isLarge photoCount={photoCount} />
      <PhotoGrid onOpenPhoto={onOpenPhoto} photos={photos} />
    </div>
  )
}

function AboutView({ photoCount }: { photoCount: number }) {
  return (
    <div className="view-stack">
      <section className="about-card">
        <div className="profile-avatar">d</div>
        <p className="section-kicker">About</p>
        <h1>daidaide gallery</h1>
        <p>
          A quiet personal gallery for small travel scenes, light, streets, and
          everyday moments. The archive currently holds {photoCount} selected
          images and will grow as new photos are added.
        </p>
      </section>
    </div>
  )
}

function ProfileHeader({
  isLarge = false,
  photoCount,
}: {
  isLarge?: boolean
  photoCount: number
}) {
  return (
    <section className={isLarge ? 'profile-header large' : 'profile-header'}>
      <div className="profile-avatar">d</div>
      <div className="profile-copy">
        <div className="profile-title-row">
          <h1>daidaide</h1>
          <span>personal gallery</span>
        </div>
        <div className="profile-stats" aria-label="Profile statistics">
          <strong>{photoCount}</strong>
          <span>posts</span>
          <strong>12</strong>
          <span>places</span>
          <strong>2026</strong>
          <span>archive</span>
        </div>
        <p>Small scenes, travel traces, and visual notes.</p>
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
