"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GithubLogo, ChartBar } from "@phosphor-icons/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import packageJson from "../../../package.json"

export default function AboutPage() {
  return (
    <div className="flex flex-1 flex-col">
      <main className="container flex-1 px-4 pt-6 pb-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader className="text-center pb-8 pt-6">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <ChartBar className="size-8" weight="duotone" />
              </div>
              <CardTitle className="text-2xl">MiMo Usage</CardTitle>
              <CardDescription>
                Dashboard for managing Xiaomi tokens
                <div className="mt-2 text-xs font-medium text-muted-foreground">
                  Version {packageJson.version}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 px-8 pb-8">
              <p className="text-sm text-muted-foreground">
                MiMo Usage is a dashboard designed to help you monitor and manage your Xiaomi tokens and API usage efficiently. 
                With built-in multiple accounts support, you can seamlessly organize your keys and usage stats in one place.
              </p>

              <div className="mt-8 border-t pt-6 text-center">
                <p className="text-sm font-medium">Build by 0xtbug</p>
                <Button variant="outline" size="sm" className="mt-4" asChild>
                  <Link href="https://github.com/0xtbug/Mimo-Usage" target="_blank" rel="noopener noreferrer">
                    <GithubLogo className="mr-2 size-4" />
                    GitHub
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
