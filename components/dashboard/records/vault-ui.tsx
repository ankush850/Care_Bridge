'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, UploadCloud, Folder, Search, MoreVertical, FileDown, Eye, Trash2, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

export function VaultUI({ user }: { user: any }) {
    const [files, setFiles] = useState<any[]>([])
    const [search, setSearch] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const fetchRecords = async () => {
            if (!user?.id) return
            setIsLoading(true)

            try {
                const { data, error } = await supabase
                    .from('medical_records')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (error) throw error
                if (data) setFiles(data)
            } catch (error) {
                console.error("Failed to load records", error)
                toast.error("Failed to load medical records")
            } finally {
                setIsLoading(false)
            }
        }

        fetchRecords()
    }, [user, supabase])

    const handleSimulateUpload = async () => {
        setIsUploading(true)

        // Simulating a file upload delay
        setTimeout(async () => {
            try {
                const { data, error } = await supabase
                    .from('medical_records')
                    .insert({
                        user_id: user.id,
                        file_name: `Scanned_Document_${Math.floor(Math.random() * 1000)}.pdf`,
                        file_path: 'simulated/path/file.pdf',
                        file_size_bytes: Math.floor(Math.random() * 5000000) + 500000, // 0.5MB to 5.5MB
                        file_type: 'application/pdf',
                        category: 'General',
                        record_date: new Date().toISOString()
                    })
                    .select()
                    .single()

                if (error) throw error

                setFiles([data, ...files])
                toast.success('File uploaded and saved securely')
            } catch (error) {
                console.error("Failed to save record", error)
                toast.error("Failed to upload document")
            } finally {
                setIsUploading(false)
            }
        }, 1500)
    }

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('medical_records')
                .delete()
                .eq('id', id)

            if (error) throw error

            setFiles(files.filter(f => f.id !== id))
            toast.info('File moved to trash')
        } catch (error) {
            console.error("Delete failed", error)
            toast.error("Failed to delete file")
        }
    }

    // Helper to format bytes to MB
    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
    }

    const filteredFiles = files.filter(f =>
        f.file_name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="flex flex-col lg:flex-row gap-6 pb-20">

            {/* Sidebar / Folders */}
            <div className="w-full lg:w-64 space-y-4 shrink-0">
                <Button
                    className="w-full justify-start text-left bg-primary text-primary-foreground hover:bg-primary/90"
                    size="lg"
                    onClick={handleSimulateUpload}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UploadCloud className="h-4 w-4 mr-2" />}
                    {isUploading ? 'Uploading...' : 'Upload Document'}
                </Button>

                <div className="space-y-1 mt-6">
                    <h4 className="text-sm font-semibold mb-3 px-2 text-muted-foreground uppercase tracking-wider">Folders</h4>
                    <Button variant="ghost" className="w-full justify-start bg-accent/50">
                        <Folder className="h-4 w-4 mr-2 text-blue-500" /> All Documents
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                        <Folder className="h-4 w-4 mr-2 text-rose-500" /> Lab Results
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                        <Folder className="h-4 w-4 mr-2 text-amber-500" /> Imaging
                    </Button>
                    <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                        <Folder className="h-4 w-4 mr-2 text-emerald-500" /> Prescriptions
                    </Button>
                </div>

                <Card className="mt-8 bg-muted/30 border-none shadow-none">
                    <CardContent className="p-4 space-y-2 text-sm">
                        <div className="flex justify-between font-medium">
                            <span>Storage Usage</span>
                            <span>{files.length > 0 ? '1' : '0'}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: files.length > 0 ? '5%' : '0%' }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {formatBytes(files.reduce((acc, f) => acc + (f.file_size_bytes || 0), 0))} of 5 GB used
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[400px]">
                <div className="p-4 border-b flex items-center gap-4 bg-muted/20">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search documents..."
                            className="pl-9 bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 p-0 overflow-auto relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                    ) : (
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Name</th>
                                    <th className="px-6 py-4 font-medium hidden md:table-cell">Category</th>
                                    <th className="px-6 py-4 font-medium hidden sm:table-cell">Date Added</th>
                                    <th className="px-6 py-4 font-medium hidden md:table-cell">Size</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredFiles.map((file, i) => (
                                    <motion.tr
                                        key={file.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-muted/30 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div className="font-medium text-foreground">{file.file_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <Badge variant="outline" className="font-normal bg-background">{file.category}</Badge>
                                        </td>
                                        <td className="px-6 py-4 hidden sm:table-cell text-muted-foreground">
                                            {format(new Date(file.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell text-muted-foreground">
                                            {formatBytes(file.file_size_bytes || 0)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => toast.success('View opened')}>
                                                        <Eye className="h-4 w-4 mr-2" /> View Document
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="cursor-pointer" onClick={() => toast.success('Download starting')}>
                                                        <FileDown className="h-4 w-4 mr-2" /> Download
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => handleDelete(file.id)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {!isLoading && filteredFiles.length === 0 && (
                        <div className="p-16 text-center text-muted-foreground flex flex-col items-center">
                            <Folder className="h-12 w-12 text-muted mb-4" />
                            <p>No documents found {search ? `matching "${search}"` : 'in your vault'}</p>
                            {!search && (
                                <Button variant="outline" className="mt-4" onClick={handleSimulateUpload} disabled={isUploading}>
                                    Upload your first document
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
