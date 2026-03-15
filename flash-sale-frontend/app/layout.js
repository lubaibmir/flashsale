import './globals.css'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'SLIME GATE — DROP 001',
  description: 'Cyberpunk Slime Drop Platform',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <div style={{ paddingTop: '52px' }}>
          {children}
        </div>
      </body>
    </html>
  )
}