"use client"

import { Fragment } from "react"

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
} from "@react-pdf/renderer"

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuLyfAZ9hjQ.ttf",
      fontWeight: 400,
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuI6fAZ9hjQ.ttf",
      fontWeight: 600,
      fontStyle: "normal",
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v18/UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuFuYAZ9hjQ.ttf",
      fontWeight: 700,
      fontStyle: "normal",
    },
  ],
})

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const G = "#1a7a5c"        // brand green
const G_DARK = "#15684e"   // border accent
const G_LIGHT = "#f0f7f4"  // panel bg
const G_PALE = "#f5f9f7"   // inner panel bg
const G_BORDER = "#c8d9d3" // border
const G_MID = "#3d5a52"    // secondary text
const G_MUTED = "#6b8f84"  // muted text
const TEXT = "#1a2e2a"     // body text

const styles = StyleSheet.create({
  // ── Shared page shell ────────────────────────────────────────────────────
  page: {
    fontFamily: "Inter",
    flexDirection: "row",
    fontSize: 9,
    color: TEXT,
    backgroundColor: "#ffffff",
  },

  // ── OUTSIDE : Back panel (left half — becomes outside-back when folded) ──
  backPanel: {
    width: "50%",
    padding: 28,
    backgroundColor: G_LIGHT,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  backLogo: {
    width: 36,
    height: 36,
    marginBottom: 10,
  },
  backSchoolName: {
    fontSize: 11,
    fontWeight: 700,
    color: G,
    marginBottom: 4,
  },
  backTagline: {
    fontSize: 8,
    color: G_MID,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  gradingScaleBox: {
    borderWidth: 1,
    borderColor: G_BORDER,
    borderRadius: 4,
    padding: 12,
    backgroundColor: "#ffffff",
  },
  commentCodesBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: G_BORDER,
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#ffffff",
  },
  commentCodesTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: G,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  commentCodeRow: {
    flexDirection: "row",
    marginBottom: 2,
    alignItems: "flex-start",
  },
  commentCodeLabel: {
    width: 18,
    fontSize: 6.5,
    fontWeight: 700,
    color: TEXT,
  },
  commentCodeText: {
    flex: 1,
    fontSize: 6.5,
    color: G_MID,
    lineHeight: 1.25,
  },
  scaleTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: G,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  scaleRow: {
    flexDirection: "row",
    marginBottom: 5,
    alignItems: "center",
  },
  scaleLetter: {
    width: 28,
    fontSize: 10,
    fontWeight: 700,
    color: TEXT,
  },
  scaleRange: {
    fontSize: 8,
    color: G_MUTED,
  },
  adminBox: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: G_BORDER,
    borderRadius: 4,
    padding: 8,
    backgroundColor: "#ffffff",
  },
  adminBoxTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: G,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: G_BORDER,
    paddingBottom: 4,
  },
  adminEntry: {
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#e8f0ec",
  },
  adminEntryLast: {
    marginBottom: 0,
    paddingBottom: 0,
  },
  adminName: {
    fontSize: 7.5,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 1,
  },
  adminPosition: {
    fontSize: 6.5,
    color: G_MID,
    marginBottom: 2,
  },
  adminContact: {
    fontSize: 6.5,
    color: G_MUTED,
    lineHeight: 1.4,
  },
  backFooter: {
    borderTopWidth: 1,
    borderTopColor: G_BORDER,
    paddingTop: 8,
  },
  backFooterText: {
    fontSize: 7,
    color: G_MUTED,
    textAlign: "center",
  },

  // ── OUTSIDE : Cover panel (right half — becomes front cover when folded) ─
  coverPanel: {
    width: "50%",
    flexDirection: "column",
    borderLeftWidth: 2,
    borderLeftColor: G_DARK,
    overflow: "hidden",
  },
  // Header: solid green with logo + school name
  coverHeader: {
    backgroundColor: G,
    paddingTop: 30,
    paddingBottom: 22,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  coverLogo: {
    width: 62,
    height: 62,
    marginBottom: 14,
  },
  coverSchoolName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#ffffff",
    textAlign: "center",
    letterSpacing: 0.5,
    marginBottom: 5,
  },
  coverHeaderTagline: {
    fontSize: 7,
    color: "rgba(255,255,255,0.68)",
    textTransform: "uppercase" as const,
    letterSpacing: 1.4,
    textAlign: "center",
  },
  // Gold accent stripe (Islamic art: pairing deep green with gold)
  coverGoldBar: {
    height: 3,
    backgroundColor: "#c9a84c",
  },
  coverDarkBar: {
    height: 2,
    backgroundColor: G_DARK,
  },
  // White body
  coverBody: {
    flex: 1,
    paddingVertical: 22,
    paddingHorizontal: 26,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  // Geometric diamond divider (inspired by Islamic geometric motifs)
  coverDecorRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "85%",
    marginBottom: 16,
  },
  coverDecorLine: {
    flex: 1,
    height: 1,
    backgroundColor: G_BORDER,
  },
  coverDecorCrescentOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: G,
    marginHorizontal: 8,
  },
  coverDecorCrescentInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#ffffff",
    position: "absolute" as const,
    top: 2,
    left: 5,
  },
  coverTitle: {
    fontSize: 8,
    fontWeight: 600,
    color: G_MUTED,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    textAlign: "center",
    marginBottom: 3,
  },
  coverPeriod: {
    fontSize: 9,
    fontWeight: 600,
    color: G_MID,
    textAlign: "center",
    marginBottom: 20,
  },
  // Double-bordered student box (Islamic frame motif)
  coverStudentBox: {
    borderWidth: 1.5,
    borderColor: G,
    borderRadius: 3,
    padding: 3,
    width: "100%",
    backgroundColor: "#ffffff",
  },
  coverStudentInner: {
    borderWidth: 1,
    borderColor: G_BORDER,
    borderRadius: 2,
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    backgroundColor: G_LIGHT,
  },
  coverStudentLabel: {
    fontSize: 7,
    color: G_MUTED,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    marginBottom: 5,
  },
  coverStudentName: {
    fontSize: 15,
    fontWeight: 700,
    color: TEXT,
    textAlign: "center",
    marginBottom: 3,
  },
  coverSection: {
    fontSize: 9,
    color: G_MID,
    textAlign: "center",
  },
  // Footer band
  coverFooterGold: {
    height: 3,
    backgroundColor: "#c9a84c",
  },
  coverFooter: {
    backgroundColor: G_DARK,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  coverFooterText: {
    fontSize: 6.5,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 1.1,
    textTransform: "uppercase" as const,
  },

  // ── INSIDE : Grades panel (left half) ────────────────────────────────────
  gradesPanel: {
    width: "50%",
    padding: 20,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  gradesPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: G_BORDER,
  },
  gradesPanelLogo: {
    width: 26,
    height: 26,
    marginRight: 8,
  },
  gradesPanelSchool: {
    fontSize: 10,
    fontWeight: 700,
    color: G,
  },
  studentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  infoGroup: {
    flexDirection: "row",
  },
  infoLabel: {
    fontSize: 8,
    color: G_MUTED,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    marginRight: 3,
  },
  infoValue: {
    fontSize: 8,
    fontWeight: 600,
    color: TEXT,
  },
  table: {
    borderWidth: 1,
    borderColor: G_BORDER,
    borderRadius: 3,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: G_LIGHT,
    borderBottomWidth: 1.5,
    borderBottomColor: G,
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 7,
    fontWeight: 700,
    color: G,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
  subjectCol: {
    width: "32%",
    borderRightWidth: 1,
    borderRightColor: G_BORDER,
  },
  gradeCol: {
    width: "13%",
    borderRightWidth: 1,
    borderRightColor: G_BORDER,
    textAlign: "center",
  },
  commentsCol: {
    width: "42%",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2ebe7",
  },
  tableRowAlt: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2ebe7",
    backgroundColor: G_PALE,
  },
  tableCell: {
    padding: 5,
    fontSize: 8,
  },
  subjectCell: {
    width: "32%",
    fontWeight: 600,
    borderRightWidth: 1,
    borderRightColor: "#e2ebe7",
  },
  gradeCell: {
    width: "13%",
    textAlign: "center",
    fontWeight: 700,
    borderRightWidth: 1,
    borderRightColor: "#e2ebe7",
  },
  commentsCell: {
    width: "42%",
    color: "#4a6b62",
    fontSize: 7,
    lineHeight: 1.4,
  },
  gradeHigh: { color: G },
  gradeMid: { color: "#a0850a" },
  gradeLow: { color: "#c53030" },

  // ── INSIDE : Hadith + Signatures panel (right half) ───────────────────────
  hadithPanel: {
    width: "50%",
    padding: 24,
    backgroundColor: G_LIGHT,
    flexDirection: "column",
    borderLeftWidth: 1,
    borderLeftColor: G_BORDER,
  },
  hadithContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hadithDecor: {
    width: 32,
    height: 2,
    backgroundColor: G,
    marginBottom: 18,
  },
  hadithTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: G,
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
  },
  hadithEnglish: {
    fontSize: 9,
    color: G_MID,
    textAlign: "center",
    lineHeight: 1.7,
    marginBottom: 10,
  },
  sigSection: {
    borderTopWidth: 1,
    borderTopColor: G_BORDER,
    paddingTop: 14,
  },
  sigRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  sigBlock: {
    width: "44%",
    alignItems: "center",
  },
  sigLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#a0b8af",
    width: "100%",
    height: 28,
    marginBottom: 4,
  },
  sigLabel: {
    fontSize: 7,
    color: G_MUTED,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateLabel: {
    fontSize: 7,
    color: G_MUTED,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    marginRight: 6,
  },
  dateLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#a0b8af",
    height: 14,
  },

  // ── Conference request checkboxes ─────────────────────────────────────────
  conferenceSection: {
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: G_BORDER,
  },
  conferenceSectionTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: G_MID,
    textTransform: "uppercase" as const,
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  conferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  checkbox: {
    width: 9,
    height: 9,
    borderWidth: 1,
    borderColor: TEXT,
    marginRight: 6,
  },
  conferenceLabel: {
    fontSize: 8,
    color: TEXT,
    fontWeight: 600,
  },
  conferenceWriteLines: {
    marginLeft: 15,
    marginBottom: 7,
    marginTop: 2,
  },
  conferenceWriteRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  conferenceWriteLabel: {
    fontSize: 7,
    color: G_MUTED,
    width: 36,
  },
  conferenceWriteLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#a0b8af",
    height: 11,
  },
})

const LOGO =
  "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/darulislahlogo-MxkoJNyGjsYuq4soDxkJzpaqFJjq7p.png"

function getGradeColor(grade: number | string | null) {
  if (grade === null || grade === undefined || grade === "INC") return {}
  if (typeof grade === "string") return {}
  if (grade >= 90) return styles.gradeHigh
  if (grade >= 70) return styles.gradeMid
  if (grade >= 60) return { color: "#d97706" }
  return styles.gradeLow
}

function getLetterGrade(grade: number | string | null): string {
  if (grade === null || grade === undefined) return ""
  if (grade === "INC") return "INC"
  if (typeof grade === "string") return grade
  if (grade > 100) return "A+"
  if (grade >= 90) return "A"
  if (grade >= 80) return "B"
  if (grade >= 70) return "C"
  if (grade >= 60) return "D"
  return "F"
}

export interface ReportCardAdministrator {
  name: string
  position: string
  email: string
  phone: string
}

export interface ReportCardStudent {
  id: string
  name: string
  sectionName: string
  subjects: {
    name: string
    grade: number | string | null
    comments: string[]
  }[]
}

export interface ReportCardCommentCode {
  code: number
  text: string
}

interface ReportCardDocumentProps {
  students: ReportCardStudent[]
  commentCodes: ReportCardCommentCode[]
  administrators: ReportCardAdministrator[]
  markingPeriodName: string
  schoolName: string
}

export function ReportCardDocument({
  students,
  commentCodes,
  administrators,
  markingPeriodName,
  schoolName,
}: ReportCardDocumentProps) {
  return (
    <Document>
      {students.map((student) => {
        return (
        <Fragment key={student.id}>
          {/*
           * ── OUTSIDE (Page 1) ────────────────────────────────────────────────
           *
           *  ┌────────────────────┬────────────────────┐
           *  │   BACK  (left)     ║   FRONT COVER (right)
           *  │  grading scale     ║   logo · name · student
           *  └────────────────────┴────────────────────┘
           *         ↑ fold here ↑
           * When printed and folded, the right panel faces up as the cover.
           */}
          <Page
            key={`${student.id}-outside`}
            size="LETTER"
            orientation="landscape"
            style={styles.page}
          >
            {/* Back panel */}
            <View style={styles.backPanel}>
              <View>
                <Image src={LOGO} style={styles.backLogo} />
                <Text style={styles.backSchoolName}>{schoolName}</Text>
                <Text style={styles.backTagline}>
                  Nurturing faith, character, and excellence.
                </Text>
                <View style={styles.gradingScaleBox}>
                  <Text style={styles.scaleTitle}>Grading Scale</Text>
                  {([
                    ["A",   "90 – 100"],
                    ["B",   "80 – 89"],
                    ["C",   "70 – 79"],
                    ["D",   "60 – 69"],
                    ["F",   "Below 60"],
                    ["INC", "Incomplete"],
                  ] as [string, string][]).map(([letter, range]) => (
                    <View key={letter} style={styles.scaleRow}>
                      <Text style={styles.scaleLetter}>{letter}</Text>
                      <Text style={styles.scaleRange}>{range}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.commentCodesBox}>
                  <Text style={styles.commentCodesTitle}>Comment Codes</Text>
                  {commentCodes.length > 0 ? (
                    commentCodes.map((item) => (
                      <View key={item.code} style={styles.commentCodeRow}>
                        <Text style={styles.commentCodeLabel}>{item.code}.</Text>
                        <Text style={styles.commentCodeText}>{item.text}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.commentCodeText}>
                      No comment codes configured.
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.backFooter}>
                <Text style={styles.backFooterText}>
                  {schoolName} · {markingPeriodName}
                </Text>
              </View>
            </View>

            {/* Front cover panel */}
            <View style={styles.coverPanel}>
              {/* Bold green header */}
              <View style={styles.coverHeader}>
                <Image src={LOGO} style={styles.coverLogo} />
                <Text style={styles.coverSchoolName}>{schoolName}</Text>
                <Text style={styles.coverHeaderTagline}>Student Report Card</Text>
              </View>
              {/* Gold + dark green divider stripes */}
              <View style={styles.coverGoldBar} />
              <View style={styles.coverDarkBar} />
              {/* White body */}
              <View style={styles.coverBody}>
                {/* Islamic geometric divider */}
                <View style={styles.coverDecorRow}>
                  <View style={styles.coverDecorLine} />
                  <View style={styles.coverDecorCrescentOuter}>
                    <View style={styles.coverDecorCrescentInner} />
                  </View>
                  <View style={styles.coverDecorLine} />
                </View>
                <Text style={styles.coverTitle}>Marking Period</Text>
                <Text style={styles.coverPeriod}>{markingPeriodName}</Text>
                {/* Double-framed student box */}
                <View style={styles.coverStudentBox}>
                  <View style={styles.coverStudentInner}>
                    <Text style={styles.coverStudentLabel}>Student</Text>
                    <Text style={styles.coverStudentName}>{student.name}</Text>
                    <Text style={styles.coverSection}>{student.sectionName}</Text>
                  </View>
                </View>
              </View>
              {/* Gold + green footer */}
              <View style={styles.coverFooterGold} />
              <View style={styles.coverFooter}>
                <Text style={styles.coverFooterText}>Nurturing Faith · Character · Excellence</Text>
              </View>
            </View>
          </Page>

          {/*
           * ── INSIDE (Page 2) ─────────────────────────────────────────────────
           *
           *  ┌────────────────────┬────────────────────┐
           *  │   GRADES (left)    ║  HADITH + SIGS (right)
           *  │  subject table     ║  hadith on knowledge
           *  │                    ║  teacher / parent sig
           *  └────────────────────┴────────────────────┘
           */}
          <Page
            key={`${student.id}-inside`}
            size="LETTER"
            orientation="landscape"
            style={styles.page}
          >
            {/* Grades panel */}
            <View style={styles.gradesPanel}>
              <View>
                <View style={styles.gradesPanelHeader}>
                  <Image src={LOGO} style={styles.gradesPanelLogo} />
                  <Text style={styles.gradesPanelSchool}>{schoolName}</Text>
                </View>
                <View style={styles.studentInfoRow}>
                  <View style={styles.infoGroup}>
                    <Text style={styles.infoLabel}>Student: </Text>
                    <Text style={styles.infoValue}>{student.name}</Text>
                  </View>
                  <View style={styles.infoGroup}>
                    <Text style={styles.infoLabel}>Section: </Text>
                    <Text style={styles.infoValue}>{student.sectionName}</Text>
                  </View>
                </View>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.tableHeaderCell, styles.subjectCol]}>Subject</Text>
                    <Text style={[styles.tableHeaderCell, styles.gradeCol]}>Grade</Text>
                    <Text style={[styles.tableHeaderCell, styles.gradeCol]}>Ltr</Text>
                    <Text style={[styles.tableHeaderCell, styles.commentsCol]}>Comments</Text>
                  </View>
                  {student.subjects.map((subj, idx) => (
                    <View
                      key={subj.name}
                      style={idx % 2 === 0 ? styles.tableRow : styles.tableRowAlt}
                    >
                      <Text style={[styles.tableCell, styles.subjectCell]}>{subj.name}</Text>
                      <Text style={[styles.tableCell, styles.gradeCell, getGradeColor(subj.grade)]}>
                        {subj.grade !== null && subj.grade !== undefined ? subj.grade : ""}
                      </Text>
                      <Text style={[styles.tableCell, styles.gradeCell, getGradeColor(subj.grade)]}>
                        {getLetterGrade(subj.grade)}
                      </Text>
                      <Text style={[styles.tableCell, styles.commentsCell]}>
                        {subj.comments.length > 0 ? subj.comments.join("; ") : "–"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Conference checkboxes + Signatures */}
              <View style={styles.sigSection}>
                <View style={styles.conferenceSection}>
                  <Text style={styles.conferenceSectionTitle}>Conference Request</Text>

                  {["Period 1", "Period 2", "Period 3"].map((period) => (
                    <Fragment key={period}>
                      <View style={styles.conferenceRow}>
                        <View style={styles.checkbox} />
                        <Text style={styles.conferenceLabel}>{period} Teacher Requests Conference</Text>
                      </View>
                      <View style={styles.conferenceWriteLines}>
                        <View style={styles.conferenceWriteRow}>
                          <Text style={styles.conferenceWriteLabel}>Email:</Text>
                          <View style={styles.conferenceWriteLine} />
                        </View>
                        <View style={styles.conferenceWriteRow}>
                          <Text style={styles.conferenceWriteLabel}>Phone:</Text>
                          <View style={styles.conferenceWriteLine} />
                        </View>
                      </View>
                    </Fragment>
                  ))}

                  <View style={styles.conferenceRow}>
                    <View style={styles.checkbox} />
                    <Text style={styles.conferenceLabel}>Parent Requests Conference</Text>
                  </View>
                  <View style={styles.conferenceWriteLines}>
                    <View style={styles.conferenceWriteRow}>
                      <Text style={styles.conferenceWriteLabel}>Email:</Text>
                      <View style={styles.conferenceWriteLine} />
                    </View>
                    <View style={styles.conferenceWriteRow}>
                      <Text style={styles.conferenceWriteLabel}>Phone:</Text>
                      <View style={styles.conferenceWriteLine} />
                    </View>
                  </View>
                </View>

                <View style={styles.sigRow}>
                  <View style={styles.sigBlock}>
                    <View style={styles.sigLine} />
                    <Text style={styles.sigLabel}>Teacher Signature</Text>
                  </View>
                  <View style={styles.sigBlock}>
                    <View style={styles.sigLine} />
                    <Text style={styles.sigLabel}>Parent Signature</Text>
                  </View>
                </View>
                <View style={styles.dateRow}>
                  <Text style={styles.dateLabel}>Date:</Text>
                  <View style={styles.dateLine} />
                </View>
              </View>
            </View>

            {/* Hadith + Admin panel */}
            <View style={styles.hadithPanel}>
              <View style={styles.hadithContent}>
                <View style={styles.hadithDecor} />
                <Text style={styles.hadithTitle}>Knowledge Hadith</Text>
                <Text style={styles.hadithEnglish}>
                  "Seeking knowledge is an obligation upon every Muslim." (Ibn
                  Majah)
                </Text>
              </View>
              {administrators.length > 0 && (
                <View style={styles.adminBox}>
                  <Text style={styles.adminBoxTitle}>Administration Contact</Text>
                  {administrators.map((admin, idx) => (
                    <View
                      key={idx}
                      style={idx === administrators.length - 1 ? styles.adminEntryLast : styles.adminEntry}
                    >
                      <Text style={styles.adminName}>{admin.name}</Text>
                      <Text style={styles.adminPosition}>{admin.position}</Text>
                      <Text style={styles.adminContact}>
                        {admin.email}{admin.phone ? `  ·  ${admin.phone}` : ""}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </Page>
        </Fragment>
        )
      })}
    </Document>
  )
}
