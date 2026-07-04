import { Fragment, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  FilePieChart,
  Plus,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  Download,
  Building,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  FileArchive,
  FileImage,
  FileCode,
  FileAudio,
  FileVideo,
  File,
} from 'lucide-react';
import { useProposalContext } from '../contexts/ProposalContext.jsx';
import {
  getStatusName,
  getStatusColor,
  getNextStatus,
  getPreviousStatus,
  STATUS_OPTIONS,
} from '../utils/statusUtils.js';
import {
  formatDate,
  getUrgencyLevel,
  getUrgencyBorderColor,
  isOverdue,
  getDaysUntilDue,
} from '../utils/dateUtils.js';
import { generateUUID } from '../utils/uuid.js';
import { formatFileSize } from '../utils/formatUtils.js';
import { useToast } from '../hooks/useToast.js';
import Button from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Separator } from '../components/ui/separator.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';
import ProposalCommandCenter from '../components/ProposalCommandCenter.jsx';
import CrmActions from '../components/CrmActions.jsx';
import RapidResponseDrafts from '../components/RapidResponseDrafts.jsx';
import StageChecklist from '../components/StageChecklist.jsx';
import StageReadinessPanel from '../components/StageReadinessPanel.jsx';
import OperatorIntelPanels from '../components/OperatorIntelPanels.jsx';

/**
 * Displays detailed information about a proposal including status and files.
 * @returns {JSX.Element} The rendered component
 */
const ProposalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const context = useProposalContext();
  const {
    getProposal,
    updateProposalStatus,
    updateProposal,
    isLoading: isProposalLoading,
    error: proposalError,
  } = context;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFileUploading, setIsFileUploading] = useState(false);

  // Get the proposal with error handling
  const proposal = id ? getProposal(id) : undefined;

  // Handle loading and error states
  useEffect(() => {
    const loadProposal = async () => {
      try {
        setIsLoading(true);

        if (id && !proposal && !isProposalLoading) {
          const loadedProposal = getProposal(id);
          if (!loadedProposal) {
            throw new Error('Proposal not found');
          }
        }

        setError(null);
      } catch (err) {
        console.error('Error loading proposal:', err);
        setError(err.message || 'Failed to load proposal');
        addToast({
          title: 'Error',
          description: 'Failed to load proposal details',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProposal();
  }, [id, proposal, isProposalLoading, getProposal, addToast]);

  // Redirect if proposal not found
  useEffect(() => {
    if (!isLoading && !proposal && !isProposalLoading && id) {
      addToast({
        title: 'Not Found',
        description: 'The requested proposal could not be found',
        variant: 'destructive',
      });
      navigate('/dashboard');
    }
  }, [proposal, isLoading, isProposalLoading, id, navigate, addToast]);

  const urgencyLevel = getUrgencyLevel(proposal?.dueDate);
  const urgencyBorderClass = getUrgencyBorderColor(urgencyLevel);
  const statusColorClass = getStatusColor(proposal?.status);
  const daysUntilDue = getDaysUntilDue(proposal?.dueDate);
  const isProposalOverdue = isOverdue(proposal?.dueDate);

  const handleStatusChange = useCallback(async (direction) => {
    try {
      setIsSubmitting(true);

      const newStatus = direction === 'next'
        ? getNextStatus(proposal.status)
        : getPreviousStatus(proposal.status);

      if (!newStatus) return;

      await updateProposalStatus(proposal.id, newStatus);

      addToast({
        title: 'Status Updated',
        description: `Proposal status changed to ${getStatusName(newStatus)}`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      addToast({
        title: 'Update Failed',
        description: 'Failed to update proposal status. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [proposal?.id, proposal?.status, updateProposalStatus, addToast]);

  // Utility: return an icon for a given MIME type/extension
  const getFileIcon = (fileType) => {
    if (!fileType) return <File className="h-5 w-5 text-slate-400 dark:text-slate-500" />;
    const type = fileType.split('/')[0];
    const extension = fileType.split('/').pop();
    const iconProps = { className: 'h-5 w-5 text-slate-400 dark:text-slate-500' };
    switch (type) {
      case 'image':
        return <FileImage {...iconProps} />;
      case 'video':
        return <FileVideo {...iconProps} />;
      case 'audio':
        return <FileAudio {...iconProps} />;
      case 'application':
        if (['pdf'].includes(extension)) return <FileText {...iconProps} />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) return <FileArchive {...iconProps} />;
        if (['xls', 'xlsx', 'csv'].includes(extension)) return <FileSpreadsheet {...iconProps} />;
        if (['doc', 'docx'].includes(extension)) return <FileText {...iconProps} />;
        if (['ppt', 'pptx'].includes(extension)) return <FilePieChart {...iconProps} />;
        if (['json', 'xml', 'html', 'css', 'js', 'ts', 'jsx', 'tsx'].includes(extension)) return <FileCode {...iconProps} />;
        return <File {...iconProps} />;
      default:
        return <File {...iconProps} />;
    }
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0) return;

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      addToast({
        title: 'File too large',
        description: `Some files exceed the maximum size of ${formatFileSize(MAX_FILE_SIZE)}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsFileUploading(true);

      const newFiles = await Promise.all(files.map((file) => new Promise((resolve) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve({
            id: generateUUID(),
            filename: file.name,
            type: file.type,
            size: file.size,
            url: URL.createObjectURL(file),
            createdAt: new Date().toISOString(),
            uploadProgress: 100,
            status: 'completed',
          });
        };

        reader.onerror = () => {
          resolve({
            id: generateUUID(),
            filename: file.name,
            type: file.type,
            size: file.size,
            error: 'Failed to read file',
            status: 'error',
          });
        };

        setTimeout(() => {
          reader.readAsDataURL(file);
        }, 500);
      })));

      await updateProposal(proposal.id, {
        files: [...(proposal.files || []), ...newFiles],
      });

      addToast({
        title: 'Files uploaded',
        description: `Successfully uploaded ${newFiles.length} file(s)`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Error uploading files:', err);
      addToast({
        title: 'Upload failed',
        description: 'Failed to upload one or more files',
        variant: 'destructive',
      });
    } finally {
      setIsFileUploading(false);
      event.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!proposal.files) return;

    try {
      const fileToDelete = proposal.files.find((f) => f.id === fileId);
      if (!fileToDelete) return;

      if (!window.confirm(`Are you sure you want to delete "${fileToDelete.filename}"?`)) {
        return;
      }

      const updatedFiles = proposal.files.filter((file) => file.id !== fileId);

      await updateProposal(proposal.id, {
        files: updatedFiles,
      });

      addToast({
        title: 'File deleted',
        description: `"${fileToDelete.filename}" has been removed`,
        variant: 'default',
      });
    } catch (err) {
      console.error('Error deleting file:', err);
      addToast({
        title: 'Delete failed',
        description: 'Failed to delete the file. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const isFinalState = useMemo(() => {
    const finalStatuses = ['submitted', 'awarded', 'rejected', 'withdrawn'];
    return finalStatuses.includes(proposal.status);
  }, [proposal?.status]);

  const formatDueDate = (dateString) => {
    if (!dateString) return 'No due date';

    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return formatDate(dateString, 'MMM d, yyyy');
  };

  if (isLoading || isProposalLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || proposalError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-error-50 border-l-4 border-error-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-error-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-error-700">
                {error || proposalError || 'An unknown error occurred'}
              </p>
            </div>
          </div>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (!proposal) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <Button
          asChild
          variant="ghost"
          className="text-primary-600 hover:text-primary-800 hover:bg-primary-50"
        >
          <Link to="/dashboard" className="flex items-center">
            <ArrowLeft size={18} className="mr-2" />
            <span>Back to Dashboard</span>
          </Link>
        </Button>
      </div>

      <Card className="mb-6 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{proposal.title}</h1>
              {proposal.referenceNumber && (
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Ref: {proposal.referenceNumber}
                </p>
              )}
            </div>
            <Button asChild variant="outline" className="self-start sm:self-center">
              <Link to={`/proposals/${proposal.id}/edit`}>
                <Edit size={16} className="mr-2" />
                Edit Proposal
              </Link>
            </Button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Badge className={`${statusColorClass} text-sm`}>
              {getStatusName(proposal.status)}
            </Badge>

            <Badge variant="outline" className={`${urgencyBorderClass} text-sm`}>
              {isProposalOverdue
                ? `Overdue: ${Math.abs(daysUntilDue)} days`
                : `Due in ${daysUntilDue} days`}
              {isProposalOverdue && (
                <AlertTriangle size={14} className="ml-1" />
              )}
            </Badge>

            {proposal.opportunityType && (
              <Badge variant="secondary" className="text-sm">
                {proposal.opportunityType}
              </Badge>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Agency/Client</h3>
              <div className="flex items-center">
                <Building size={18} className="mr-2 text-slate-400 dark:text-slate-500" />
                <p className="text-slate-900 dark:text-slate-100">{proposal.agency || 'Not specified'}</p>
              </div>
            </div>

            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Due Date</h3>
              <div className="flex items-center">
                <Clock size={18} className={`mr-2 ${isProposalOverdue ? 'text-error-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <p className={`${isProposalOverdue ? 'text-error-600 font-medium' : 'text-slate-900 dark:text-slate-100'}`}>
                  {formatDueDate(proposal.dueDate)}
                  {isProposalOverdue && (
                    <span className="ml-1 text-error-500">(Overdue)</span>
                  )}
                </p>
              </div>
            </div>

            {proposal.budget && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Budget</h3>
                <p className="text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: proposal.currency || 'USD',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(proposal.budget)}
                </p>
              </div>
            )}

            {proposal.contactName && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Contact</h3>
                <p className="text-slate-900 dark:text-slate-100">{proposal.contactName}</p>
                {proposal.contactEmail && (
                  <a
                    href={`mailto:${proposal.contactEmail}`}
                    className="text-primary-600 hover:underline text-sm"
                  >
                    {proposal.contactEmail}
                  </a>
                )}
                {proposal.contactPhone && (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{proposal.contactPhone}</p>
                )}
              </div>
            )}

            {proposal.submissionDate && (
              <div>
                <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {isFinalState ? 'Submitted On' : 'Expected Submission'}
                </h3>
                <p className="text-slate-900 dark:text-slate-100">
                  {formatDate(proposal.submissionDate, 'Not specified')}
                </p>
              </div>
            )}

            <div>
              <h3 className="mb-1 text-sm font-medium text-slate-500 dark:text-slate-400">Created</h3>
              <p className="text-slate-900 dark:text-slate-100">
                {formatDate(proposal.createdAt, 'N/A')}
              </p>
            </div>
          </div>

          {proposal.notes && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">Notes</h3>
              <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                  {proposal.notes}
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 dark:border-slate-700 dark:bg-slate-900/70">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-4 sm:mb-0">
              <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Workflow Status
              </h3>
              <div className="flex items-center">
                <span className={`${statusColorClass} px-3 py-1 rounded-full text-sm font-medium`}>
                  {getStatusName(proposal.status)}
                </span>

                <div className="hidden md:flex items-center ml-6">
                  {STATUS_OPTIONS.map((status, index) => (
                    <Fragment key={status.value}>
                      {index > 0 && (
                        <div className={`h-0.5 w-8 ${
                          index <= STATUS_OPTIONS.findIndex((s) => s.value === proposal.status)
                            ? 'bg-primary-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                        }`} />
                      )}
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center ${
                          index <= STATUS_OPTIONS.findIndex((s) => s.value === proposal.status)
                            ? 'bg-primary-500 text-white'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {index < STATUS_OPTIONS.findIndex((s) => s.value === proposal.status) ? (
                          <CheckCircle2 size={14} />
                        ) : (
                          <span className="text-xs font-medium">{index + 1}</span>
                        )}
                      </div>
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={() => handleStatusChange('previous')}
                disabled={!getPreviousStatus(proposal.status) || isSubmitting}
                variant="outline"
                className="min-w-[120px] justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ChevronLeft size={16} className="mr-1" />
                )}
                Previous
              </Button>

              <Button
                onClick={() => handleStatusChange('next')}
                disabled={!getNextStatus(proposal.status) || isSubmitting}
                className="min-w-[120px] justify-center"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <span className="mr-1">Next</span>
                )}
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <OperatorIntelPanels proposal={proposal} />

      <RapidResponseDrafts
        proposal={proposal}
        addToast={addToast}
      />

      <CrmActions
        proposal={proposal}
        onRefresh={context.fetchProposals}
        addToast={addToast}
      />

      <ProposalCommandCenter
        proposal={proposal}
        onProposalRefresh={context.fetchProposals}
        addToast={addToast}
      />

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Files & Attachments</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {proposal.files?.length || 0} {proposal.files?.length === 1 ? 'file' : 'files'} attached
              </p>
            </div>
            <div>
              <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer">
                <Plus size={16} className="mr-2" />
                <span>Add File</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isFileUploading}
                />
              </label>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isFileUploading && (
            <div className="mb-4 flex items-center rounded-md bg-blue-50 p-3 dark:bg-blue-950/30">
              <Loader2 className="h-4 w-4 text-blue-500 animate-spin mr-2" />
              <span className="text-sm text-blue-700 dark:text-blue-200">Uploading files, please wait...</span>
            </div>
          )}

          {proposal.files && proposal.files.length > 0 ? (
            <div className="space-y-2">
              {proposal.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between rounded-md p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-center min-w-0">
                    <div className="mr-3 rounded-md bg-slate-100 p-2 dark:bg-slate-800">
                      {getFileIcon(file.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">{file.filename}</p>
                      <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>Uploaded {formatDate(file.createdAt, 'N/A')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.url, '_blank')}
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-100"
                    >
                      <Download size={16} className="mr-1" />
                      <span className="sr-only">Download</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
                    >
                      <Trash2 size={16} className="mr-1" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-md border-2 border-dashed border-slate-200 py-8 text-center dark:border-slate-700">
              <FileText size={48} className="mx-auto mb-3 text-slate-300 dark:text-slate-600" />
              <h3 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">No files yet</h3>
              <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
                Upload files to keep them organized with this proposal
              </p>
              <label className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer">
                <Plus size={16} className="mr-2" />
                <span>Add your first file</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isFileUploading}
                />
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <StageChecklist proposal={proposal} />
      <StageReadinessPanel proposalId={proposal.id} />
    </div>
  );
};

export default ProposalDetails;
