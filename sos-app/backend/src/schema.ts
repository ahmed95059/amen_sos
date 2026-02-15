import gql from "graphql-tag";

export const typeDefs = gql`
  enum Role { DECLARANT PSY ADMIN_IT DIR_VILLAGE RESPONSABLE_SAUVEGARDE DIR_NATIONAL }
  enum CaseStatus { PENDING IN_PROGRESS SIGNED FALSE_REPORT CLOSED }
  enum Urgency { LOW MEDIUM HIGH CRITICAL }
  enum IncidentType { HEALTH BEHAVIOR VIOLENCE SEXUAL_ABUSE NEGLECT CONFLICT OTHER }
  enum DocumentType { FICHE_INITIALE RAPPORT_DPE }

  type Village { id: ID!, name: String! }

  type User {
    id: ID!
    name: String!
    email: String!
    whatsappNumber: String
    role: Role!
    village: Village
  }

  type Attachment {
    id: ID!
    filename: String!
    mimeType: String!
    sizeBytes: Int!
    downloadUrl: String!
    createdAt: String!
  }

  type CaseDocument {
    id: ID!
    docType: DocumentType!
    filename: String!
    mimeType: String!
    sizeBytes: Int!
    downloadUrl: String!
    createdAt: String!
  }

  type CaseAssignment {
    id: ID!
    assignmentRole: String!
    psychologist: User!
    assignedAt: String!
  }

  type Case {
    id: ID!
    createdAt: String!
    updatedAt: String!
    status: CaseStatus!
    score: Int!

    isAnonymous: Boolean!
    village: Village!

    incidentType: IncidentType!
    urgency: Urgency!

    abuserName: String
    childName: String
    description: String

    createdBy: User
    attachments: [Attachment!]!
    assignments: [CaseAssignment!]!
    documents: [CaseDocument!]!

    dirVillageValidatedAt: String
    dirVillageSignature: String
    sauvegardeValidatedAt: String
    sauvegardeSignature: String
  }

  type Notification {
    id: ID!
    type: String!
    message: String!
    caseId: String
    createdAt: String!
    readAt: String
  }

  type AuditLogEntry {
    id: ID!
    createdAt: String!
    action: String!
    entity: String!
    entityId: String!
    actorName: String
    actorEmail: String
    metaJson: String
  }

  type CaseStatusCount {
    status: CaseStatus!
    count: Int!
  }

  type VillageCaseCount {
    villageId: ID!
    villageName: String!
    count: Int!
  }

  type AdminStats {
    totalCases: Int!
    totalUsers: Int!
    byStatus: [CaseStatusCount!]!
    byVillage: [VillageCaseCount!]!
  }

  type AuthPayload { token: String!, user: User! }

  input FileInput {
    filename: String!
    mimeType: String!
    base64: String!
  }

  input CreateCaseInput {
    isAnonymous: Boolean!
    villageId: ID!
    incidentType: IncidentType!
    urgency: Urgency!
    abuserName: String
    childName: String
    description: String
    attachments: [FileInput!]
  }

  input AdminCreateUserInput {
    name: String!
    email: String!
    password: String!
    role: Role!
    villageId: ID
    whatsappNumber: String
  }

  type Query {
    me: User
    villages: [Village!]!

    myCases: [Case!]!
    caseById(id: ID!): Case

    psyAssignedCases(status: CaseStatus): [Case!]!
    dirVillageCases: [Case!]!
    sauvegardeCases: [Case!]!
    adminStats: AdminStats!
    adminLogs(limit: Int): [AuditLogEntry!]!
    adminUsers: [User!]!

    myNotifications: [Notification!]!
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!

    createCase(input: CreateCaseInput!): Case!

    psyUpdateCaseStatus(caseId: ID!, status: CaseStatus!): Case!
    psyUploadDocument(caseId: ID!, docType: DocumentType!, file: FileInput!): CaseDocument!
    dirVillageValidateCase(caseId: ID!, signatureFile: FileInput!): Case!
    sauvegardeValidateCase(caseId: ID!, signatureFile: FileInput!): Case!
    adminCreateUser(input: AdminCreateUserInput!): User!
    adminDeleteUser(userId: ID!): Boolean!

    markNotificationRead(id: ID!): Notification!
  }
`;
