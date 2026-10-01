import { useCallback, useEffect, useState } from 'react'
import { getProjects } from '../api/projectApi'
import type { Project } from '../types/project.types'

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadProjects = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await getProjects()
      setProjects(response.projects)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load projects.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadProjects() }, [loadProjects])
  return { projects, isLoading, error, reload: loadProjects }
}
