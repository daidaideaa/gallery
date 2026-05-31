import { useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  Home,
  Languages,
  Map,
  MapPin,
  Moon,
  Shuffle,
  Sun,
  UserRound,
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
  | { status: 'ready'; photo: Photo }
  | { status: 'empty' }
  | { status: 'error'; message: string }

type Theme = 'light' | 'dark'

const navItems = [
  { label: 'Home', icon: Home, active: true },
  { label: 'Shuin', icon: BookOpen },
  { label: 'Map', icon: Map },
  { label: 'Lucky', icon: Shuffle },
]

function App() {
  const [gallery, setGallery] = useState<LoadState>({ status: 'loading' })
  const [theme, setTheme] = useState<Theme>(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

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
        const [photo] = data.photos

        if (!photo) {
          setGallery({ status: 'empty' })
          return
        }

        setGallery({ status: 'ready', photo })
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
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="topbar" aria-label="Site header">
        <a className="brand" href={import.meta.env.BASE_URL}>
          daidaideaa Gallery
        </a>
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="Language">
            <Languages size={20} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="page-frame">
        <aside className="sidebar" aria-label="Gallery navigation">
          <nav className="nav-list">
            {navItems.map((item) => {
              const Icon = item.icon

              return (
                <button
                  className={item.active ? 'nav-item active' : 'nav-item'}
                  key={item.label}
                  type="button"
                >
                  <Icon size={22} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="copyright">
            <p>&copy; 2026 daidaideaa</p>
            <p>Images and text are reserved by the owner.</p>
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

          {gallery.status === 'ready' && <PhotoView photo={gallery.photo} />}
        </section>
      </div>

      <nav className="mobile-nav" aria-label="Mobile gallery navigation">
        {navItems.slice(0, 3).map((item) => {
          const Icon = item.icon

          return (
            <button
              className={item.active ? 'mobile-nav-item active' : 'mobile-nav-item'}
              key={item.label}
              type="button"
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </button>
          )
        })}
      </nav>
    </main>
  )
}

function StatePanel({
  children,
  isError = false,
}: {
  children: React.ReactNode
  isError?: boolean
}) {
  return (
    <div className={isError ? 'state-panel state-panel-error' : 'state-panel'}>
      {children}
    </div>
  )
}

function PhotoView({ photo }: { photo: Photo }) {
  return (
    <div className="photo-view">
      <div className="section-title">
        <p>Home</p>
        <h1>Photos</h1>
      </div>

      <article className="gallery-card">
        <div className="image-wrap">
          <img
            src={photo.image.url}
            width={photo.image.width}
            height={photo.image.height}
            alt={photo.image.alt}
          />
          <div className="image-credit">
            &copy; {new Date(photo.takenAt).getFullYear()} {photo.author}
          </div>
        </div>
        <footer className="card-footer">
          <div>
            <h2>{photo.title}</h2>
            <p>{photo.location}</p>
          </div>
          <span>#{photo.id}</span>
        </footer>
      </article>

      <div className="details-grid">
        <InfoCard icon={UserRound} label="Author" value={photo.author} />
        <InfoCard icon={CalendarDays} label="Date" value={photo.takenAt} />
        <InfoCard icon={MapPin} label="Location" value={photo.location} />
      </div>

      <p className="description">{photo.description}</p>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UserRound
  label: string
  value: string
}) {
  return (
    <section className="info-card">
      <Icon size={20} />
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </section>
  )
}

export default App
