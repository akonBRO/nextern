'use client';

import { useEffect, useRef, useState } from 'react';
import type {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from 'agora-rtc-sdk-ng';
import { formatDhakaDateTime } from '@/lib/datetime';
import { useUploadThing } from '@/lib/uploadthing';
import { formatInterviewRecommendation } from '@/lib/hiring-suite-shared';
import {
  Camera,
  CheckCircle2,
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  Save,
  Upload,
  Video,
  VideoOff,
} from 'lucide-react';

type InterviewData = {
  _id: string;
  title: string;
  status: string;
  mode: 'one_on_one' | 'panel';
  scheduledAt: string;
  durationMinutes: number;
  description?: string;
  agoraChannelName: string;
  consentStatus: 'pending' | 'granted' | 'declined';
  recordingStatus: string;
  liveNotes?: string;
  panelists?: Array<{ name: string; email?: string; role?: string }>;
  scorecard?: {
    communication?: number;
    technical?: number;
    problemSolving?: number;
    cultureFit?: number;
    confidence?: number;
    overallScore?: number;
    recommendation?: 'strong_yes' | 'yes' | 'maybe' | 'no';
    summary?: string;
  };
  recordingAsset?: { url: string; name: string; type: string };
  jobId?: { title?: string; companyName?: string };
  studentId?: { name?: string; email?: string; university?: string; department?: string };
};

type Props = {
  role: 'student' | 'employer';
  interview: InterviewData;
};

function formatDateTime(value: string) {
  return formatDhakaDateTime(value, 'Not scheduled');
}

const fieldStyle = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 12,
  border: '1px solid #D9E2EC',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: 13,
  outline: 'none',
} as const;
type AgoraModule = typeof import('agora-rtc-sdk-ng').default;

export default function InterviewRoomClient({ role, interview }: Props) {
  const [currentInterview, setCurrentInterview] = useState(interview);
  const [joined, setJoined] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [remoteUsers, setRemoteUsers] = useState<string[]>([]);
  const [liveNotes, setLiveNotes] = useState(interview.liveNotes ?? '');
  const [scorecard, setScorecard] = useState({
    communication: interview.scorecard?.communication ?? 0,
    technical: interview.scorecard?.technical ?? 0,
    problemSolving: interview.scorecard?.problemSolving ?? 0,
    cultureFit: interview.scorecard?.cultureFit ?? 0,
    confidence: interview.scorecard?.confidence ?? 0,
    recommendation: interview.scorecard?.recommendation ?? 'maybe',
    summary: interview.scorecard?.summary ?? '',
  });
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const agoraModuleRef = useRef<AgoraModule | null>(null);
  const localTracksRef = useRef<{
    audioTrack?: IMicrophoneAudioTrack;
    videoTrack?: ICameraVideoTrack;
    screenTrack?: ILocalVideoTrack;
  }>({});
  const remoteUserMapRef = useRef<Map<string, IAgoraRTCRemoteUser>>(new Map());
  const localVideoRef = useRef<HTMLDivElement>(null);
  const { startUpload, isUploading } = useUploadThing('interviewRecordingUploader');
  const isRoomClosed =
    currentInterview.status === 'completed' || currentInterview.status === 'cancelled';
  const roomClosedMessage =
    currentInterview.status === 'completed'
      ? 'This interview has been marked as completed. The room can no longer be joined.'
      : currentInterview.status === 'cancelled'
        ? 'This interview has been cancelled. The room is no longer available.'
        : '';

  useEffect(() => {
    return () => {
      leaveRoom().catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!joined || !isRoomClosed) return;

    leaveRoom()
      .then(() => setNotice(roomClosedMessage || 'This interview room is now closed.'))
      .catch(() => {});
  }, [isRoomClosed, joined, roomClosedMessage]);

  async function updateInterview(payload: Record<string, unknown>) {
    const res = await fetch(`/api/interviews/${currentInterview._id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { error?: string; interview?: InterviewData };
    if (!res.ok) {
      throw new Error(data.error ?? 'Unable to update interview session.');
    }
    if (data.interview) {
      setCurrentInterview(data.interview);
    }
    return data.interview;
  }

  async function joinRoom() {
    if (isRoomClosed) {
      setError(roomClosedMessage);
      setNotice('');
      return;
    }

    setJoining(true);
    setError('');
    setNotice('');

    try {
      const tokenRes = await fetch(`/api/interviews/${currentInterview._id}/token`, {
        method: 'POST',
      });
      const tokenData = (await tokenRes.json()) as {
        error?: string;
        appId?: string;
        channelName?: string;
        token?: string | null;
        uid?: number;
      };

      if (!tokenRes.ok || !tokenData.appId || !tokenData.channelName || !tokenData.uid) {
        throw new Error(tokenData.error ?? 'Unable to join the interview room.');
      }

      const agoraModule = await import('agora-rtc-sdk-ng');
      agoraModuleRef.current = agoraModule.default;

      const client = agoraModule.default.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on(
        'user-published',
        async (user: IAgoraRTCRemoteUser, mediaType: 'video' | 'audio' | 'datachannel') => {
          await client.subscribe(user, mediaType);
          remoteUserMapRef.current.set(String(user.uid), user);

          if (mediaType === 'video') {
            setRemoteUsers(Array.from(remoteUserMapRef.current.keys()));
            window.setTimeout(() => user.videoTrack?.play(`remote-video-${user.uid}`), 0);
          }

          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        }
      );

      client.on('user-left', (user: IAgoraRTCRemoteUser) => {
        remoteUserMapRef.current.delete(String(user.uid));
        setRemoteUsers(Array.from(remoteUserMapRef.current.keys()));
      });

      await client.join(
        tokenData.appId,
        tokenData.channelName,
        tokenData.token ?? null,
        tokenData.uid
      );

      const [audioTrack, videoTrack] = await agoraModule.default.createMicrophoneAndCameraTracks();
      localTracksRef.current.audioTrack = audioTrack;
      localTracksRef.current.videoTrack = videoTrack;

      await client.publish([audioTrack, videoTrack]);
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      setJoined(true);
      setNotice('You joined the interview room successfully.');
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : 'Unable to join the room.');
    } finally {
      setJoining(false);
    }
  }

  async function leaveRoom() {
    const client = clientRef.current;
    const tracks = localTracksRef.current;

    if (tracks.screenTrack) {
      tracks.screenTrack.stop();
      tracks.screenTrack.close();
      tracks.screenTrack = undefined;
    }
    if (tracks.videoTrack) {
      tracks.videoTrack.stop();
      tracks.videoTrack.close();
      tracks.videoTrack = undefined;
    }
    if (tracks.audioTrack) {
      tracks.audioTrack.stop();
      tracks.audioTrack.close();
      tracks.audioTrack = undefined;
    }

    if (client) {
      await client.leave();
      clientRef.current = null;
    }

    remoteUserMapRef.current.clear();
    setRemoteUsers([]);
    setJoined(false);
    setScreenSharing(false);
  }

  async function toggleMic() {
    const track = localTracksRef.current.audioTrack;
    if (!track) return;
    await track.setEnabled(!micEnabled);
    setMicEnabled((value) => !value);
  }

  async function toggleCamera() {
    const track = localTracksRef.current.videoTrack;
    if (!track) return;
    await track.setEnabled(!cameraEnabled);
    setCameraEnabled((value) => !value);
  }

  async function toggleScreenShare() {
    if (role !== 'employer' || !clientRef.current || !agoraModuleRef.current) return;
    const client = clientRef.current;

    if (screenSharing && localTracksRef.current.screenTrack) {
      await client.unpublish(localTracksRef.current.screenTrack);
      localTracksRef.current.screenTrack.stop();
      localTracksRef.current.screenTrack.close();
      localTracksRef.current.screenTrack = undefined;
      if (localTracksRef.current.videoTrack) {
        await client.publish(localTracksRef.current.videoTrack);
        if (localVideoRef.current) {
          localTracksRef.current.videoTrack.play(localVideoRef.current);
        }
      }
      setScreenSharing(false);
      return;
    }

    const screenResult = await agoraModuleRef.current.createScreenVideoTrack(
      { encoderConfig: '1080p_1', optimizationMode: 'detail' },
      'auto'
    );
    const screenTrack = Array.isArray(screenResult) ? screenResult[0] : screenResult;

    if (localTracksRef.current.videoTrack) {
      await client.unpublish(localTracksRef.current.videoTrack);
    }
    await client.publish(screenTrack);
    localTracksRef.current.screenTrack = screenTrack;
    if (localVideoRef.current) {
      screenTrack.play(localVideoRef.current);
    }
    setScreenSharing(true);
  }

  async function handleRecordingUpload(files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await startUpload(Array.from(files));
    const file = uploaded?.[0];
    if (!file) return;

    try {
      await updateInterview({
        action: 'recording_uploaded',
        recordingAsset: { url: file.ufsUrl, name: file.name, type: file.type },
      });
      setNotice('Recording attached successfully.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Recording upload failed.');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {error ? (
        <div
          style={{
            borderRadius: 16,
            padding: '12px 14px',
            background: '#FEF2F2',
            color: '#991B1B',
            border: '1px solid #FECACA',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          style={{
            borderRadius: 16,
            padding: '12px 14px',
            background: '#ECFDF5',
            color: '#065F46',
            border: '1px solid #A7F3D0',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {notice}
        </div>
      ) : null}

      {isRoomClosed ? (
        <div
          style={{
            borderRadius: 16,
            padding: '12px 14px',
            background: currentInterview.status === 'completed' ? '#F8FAFC' : '#FEF2F2',
            color: currentInterview.status === 'completed' ? '#334155' : '#991B1B',
            border: `1px solid ${currentInterview.status === 'completed' ? '#CBD5E1' : '#FECACA'}`,
            fontSize: 13,
            fontWeight: 700,
            lineHeight: 1.7,
          }}
        >
          {roomClosedMessage}
        </div>
      ) : null}

      <div className="interview-room-grid">
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #D9E2EC',
            boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
              Agora interview room • {formatDateTime(currentInterview.scheduledAt)}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {!joined ? (
                isRoomClosed ? (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: currentInterview.status === 'completed' ? '#F8FAFC' : '#FEF2F2',
                      color: currentInterview.status === 'completed' ? '#334155' : '#991B1B',
                      border: `1px solid ${
                        currentInterview.status === 'completed' ? '#CBD5E1' : '#FECACA'
                      }`,
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    <CheckCircle2 size={14} />
                    {currentInterview.status === 'completed'
                      ? 'Interview completed'
                      : 'Interview cancelled'}
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={joinRoom}
                    disabled={joining}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: joining ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {joining ? <Loader2 size={14} className="spin" /> : <Video size={14} />}
                    {joining ? 'Joining...' : 'Join room'}
                  </button>
                )
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleMic}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#FFFFFF',
                      color: '#334155',
                      border: '1px solid #D9E2EC',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {micEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                    {micEnabled ? 'Mute' : 'Unmute'}
                  </button>
                  <button
                    type="button"
                    onClick={toggleCamera}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#FFFFFF',
                      color: '#334155',
                      border: '1px solid #D9E2EC',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    {cameraEnabled ? <Camera size={14} /> : <VideoOff size={14} />}
                    {cameraEnabled ? 'Camera on' : 'Camera off'}
                  </button>
                  {role === 'employer' ? (
                    <button
                      type="button"
                      onClick={toggleScreenShare}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        border: '1px solid #BFDBFE',
                        borderRadius: 12,
                        padding: '10px 14px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer',
                      }}
                    >
                      <MonitorUp size={14} />
                      {screenSharing ? 'Stop share' : 'Share screen'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => leaveRoom().catch(() => {})}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#FEF2F2',
                      color: '#991B1B',
                      border: '1px solid #FECACA',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    <PhoneOff size={14} />
                    Leave
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={{ padding: 16 }}>
            <div className="interview-video-grid">
              <div
                style={{
                  borderRadius: 18,
                  border: '1px solid #E2E8F0',
                  background: '#0F172A',
                  minHeight: 280,
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div ref={localVideoRef} style={{ width: '100%', height: '100%' }} />
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    bottom: 12,
                    background: 'rgba(15,23,42,0.72)',
                    color: '#FFFFFF',
                    borderRadius: 999,
                    padding: '6px 10px',
                    fontSize: 11,
                    fontWeight: 800,
                  }}
                >
                  {role === 'employer' ? 'Hiring team' : 'You'}
                </div>
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                {remoteUsers.length === 0 ? (
                  <div
                    style={{
                      borderRadius: 18,
                      border: '1px dashed #CBD5E1',
                      background: '#F8FAFC',
                      minHeight: 280,
                      display: 'grid',
                      placeItems: 'center',
                      color: '#64748B',
                      padding: 24,
                      textAlign: 'center',
                      lineHeight: 1.7,
                    }}
                  >
                    Waiting for the other participant to join the room.
                  </div>
                ) : (
                  remoteUsers.map((userId) => (
                    <div
                      key={userId}
                      id={`remote-video-${userId}`}
                      style={{
                        borderRadius: 18,
                        border: '1px solid #E2E8F0',
                        background: '#0F172A',
                        minHeight: 280,
                        overflow: 'hidden',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              border: '1px solid #D9E2EC',
              boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
              padding: 18,
              display: 'grid',
              gap: 12,
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Interview details</div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
              {currentInterview.description || 'No extra description was added for this session.'}
            </div>
            <div style={{ display: 'grid', gap: 6, fontSize: 12, color: '#475569' }}>
              <span>Status: {currentInterview.status.replace('_', ' ')}</span>
              <span>Mode: {currentInterview.mode === 'panel' ? 'Panel' : 'One-on-one'}</span>
              <span>Recording consent: {currentInterview.consentStatus}</span>
              <span>Recording status: {currentInterview.recordingStatus}</span>
            </div>
            {(currentInterview.panelists ?? []).length > 0 ? (
              <div style={{ display: 'grid', gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#334155' }}>Panelists</div>
                {(currentInterview.panelists ?? []).map((panelist) => (
                  <div
                    key={`${panelist.name}-${panelist.email}`}
                    style={{ fontSize: 12, color: '#64748B' }}
                  >
                    {panelist.name}
                    {panelist.email ? ` • ${panelist.email}` : ''}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {role === 'student' ? (
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: 20,
                border: '1px solid #D9E2EC',
                boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                padding: 18,
                display: 'grid',
                gap: 12,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                Recording consent
              </div>
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                Employers can only attach a recording after you explicitly grant consent.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() =>
                    updateInterview({ action: 'consent_granted' })
                      .then(() => setNotice('Recording consent granted.'))
                      .catch((updateError) =>
                        setError(
                          updateError instanceof Error
                            ? updateError.message
                            : 'Unable to update consent.'
                        )
                      )
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={14} />
                  Grant consent
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateInterview({ action: 'consent_declined' })
                      .then(() => setNotice('Recording consent declined.'))
                      .catch((updateError) =>
                        setError(
                          updateError instanceof Error
                            ? updateError.message
                            : 'Unable to update consent.'
                        )
                      )
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #FECACA',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                  }}
                >
                  Decline recording
                </button>
              </div>
            </div>
          ) : null}

          {role === 'employer' ? (
            <>
              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  border: '1px solid #D9E2EC',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                  padding: 18,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Live notes</div>
                <textarea
                  value={liveNotes}
                  onChange={(event) => setLiveNotes(event.target.value)}
                  rows={6}
                  style={{ ...fieldStyle, resize: 'vertical', minHeight: 140 }}
                />
                <button
                  type="button"
                  onClick={() =>
                    updateInterview({ action: 'update_notes', liveNotes })
                      .then(() => setNotice('Interview notes saved.'))
                      .catch((updateError) =>
                        setError(
                          updateError instanceof Error
                            ? updateError.message
                            : 'Unable to save notes.'
                        )
                      )
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#0F172A',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                >
                  <Save size={14} />
                  Save notes
                </button>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  border: '1px solid #D9E2EC',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                  padding: 18,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>Scorecard</div>
                <div className="scorecard-grid">
                  {[
                    { key: 'communication', label: 'Communication' },
                    { key: 'technical', label: 'Technical' },
                    { key: 'problemSolving', label: 'Problem solving' },
                    { key: 'cultureFit', label: 'Culture fit' },
                    { key: 'confidence', label: 'Confidence' },
                  ].map((item) => (
                    <label key={item.key} style={{ display: 'grid', gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                        {item.label}
                      </span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={scorecard[item.key as keyof typeof scorecard] as number}
                        onChange={(event) =>
                          setScorecard((current) => ({
                            ...current,
                            [item.key]: Number(event.target.value) || 0,
                          }))
                        }
                        style={fieldStyle}
                      />
                    </label>
                  ))}
                </div>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                    Recommendation
                  </span>
                  <select
                    value={scorecard.recommendation}
                    onChange={(event) =>
                      setScorecard((current) => ({
                        ...current,
                        recommendation: event.target.value as typeof current.recommendation,
                      }))
                    }
                    style={fieldStyle}
                  >
                    <option value="strong_yes">Strong yes</option>
                    <option value="yes">Yes</option>
                    <option value="maybe">Maybe</option>
                    <option value="no">No</option>
                  </select>
                </label>
                <textarea
                  value={scorecard.summary}
                  onChange={(event) =>
                    setScorecard((current) => ({ ...current, summary: event.target.value }))
                  }
                  rows={4}
                  style={{ ...fieldStyle, resize: 'vertical', minHeight: 110 }}
                  placeholder="Summarize the interview outcome, concerns, and next recommendation."
                />
                <button
                  type="button"
                  onClick={() =>
                    updateInterview({ action: 'update_scorecard', scorecard })
                      .then(() =>
                        setNotice(
                          `Scorecard saved. Current recommendation: ${formatInterviewRecommendation(scorecard.recommendation)}.`
                        )
                      )
                      .catch((updateError) =>
                        setError(
                          updateError instanceof Error
                            ? updateError.message
                            : 'Unable to save scorecard.'
                        )
                      )
                  }
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    borderRadius: 12,
                    padding: '10px 14px',
                    fontSize: 12,
                    fontWeight: 800,
                    cursor: 'pointer',
                    width: 'fit-content',
                  }}
                >
                  <Save size={14} />
                  Save scorecard
                </button>
              </div>

              <div
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  border: '1px solid #D9E2EC',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                  padding: 18,
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                  Recording and closeout
                </div>
                <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                  Attach the final recording only after consent is granted. The recording is stored
                  against the interview record for the hiring team.
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#F8FAFC',
                      color: '#334155',
                      border: '1px solid #D9E2EC',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor:
                        currentInterview.consentStatus !== 'granted' || isUploading
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    <Upload size={14} />
                    {isUploading ? 'Uploading...' : 'Upload recording'}
                    <input
                      type="file"
                      accept="video/*"
                      style={{ display: 'none' }}
                      disabled={currentInterview.consentStatus !== 'granted'}
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const files = input.files;
                        input.value = '';
                        await handleRecordingUpload(files);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      updateInterview({ action: 'mark_completed' })
                        .then(() => setNotice('Interview marked as completed.'))
                        .catch((updateError) =>
                          setError(
                            updateError instanceof Error
                              ? updateError.message
                              : 'Unable to complete interview.'
                          )
                        )
                    }
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      background: '#0F172A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: 12,
                      padding: '10px 14px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor:
                        currentInterview.status === 'completed' ||
                        currentInterview.status === 'cancelled'
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        currentInterview.status === 'completed' ||
                        currentInterview.status === 'cancelled'
                          ? 0.6
                          : 1,
                    }}
                    disabled={
                      currentInterview.status === 'completed' ||
                      currentInterview.status === 'cancelled'
                    }
                  >
                    <CheckCircle2 size={14} />
                    {currentInterview.status === 'completed'
                      ? 'Completed'
                      : currentInterview.status === 'cancelled'
                        ? 'Interview cancelled'
                        : 'Mark completed'}
                  </button>
                </div>
                {currentInterview.recordingAsset ? (
                  <a
                    href={currentInterview.recordingAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      color: '#2563EB',
                      fontSize: 12,
                      fontWeight: 800,
                      textDecoration: 'none',
                    }}
                  >
                    View uploaded recording
                  </a>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </div>

      <style>{`
        .interview-room-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) 360px;
          gap: 16px;
        }

        .interview-video-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 12px;
        }

        .scorecard-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1080px) {
          .interview-room-grid,
          .interview-video-grid,
          .scorecard-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
