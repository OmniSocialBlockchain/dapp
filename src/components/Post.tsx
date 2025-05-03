'use client'

import { useState } from 'react'

interface PostProps {
  post: {
    id: number
    author: string
    content: string
    timestamp: string
    likes: number
    comments: number
  }
}

export function Post({ post }: PostProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)

  const handleLike = () => {
    setLiked(!liked)
    setLikeCount(liked ? likeCount - 1 : likeCount + 1)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-2" />
        <div>
          <p className="font-medium">{post.author}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{post.timestamp}</p>
        </div>
      </div>
      <p className="mb-4">{post.content}</p>
      <div className="flex space-x-4 text-gray-500 dark:text-gray-400">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 ${
            liked ? 'text-red-500' : ''
          }`}
        >
          <svg
            className="w-5 h-5"
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <span>{likeCount}</span>
        </button>
        <button className="flex items-center space-x-1">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <span>{post.comments}</span>
        </button>
      </div>
    </div>
  )
} 