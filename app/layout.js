import './globals.css'

export const metadata = { title: 'Humanode ENS Demo' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
