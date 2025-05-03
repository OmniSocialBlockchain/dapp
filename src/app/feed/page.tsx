import { Layout } from '@/components/Layout'
import { Feed } from '@/components/Feed'
import { CreatePost } from '@/components/CreatePost'

export default function FeedPage() {
  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Feed</h1>
        <CreatePost />
        <Feed />
      </div>
    </Layout>
  )
} 