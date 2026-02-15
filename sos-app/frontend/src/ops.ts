import { gql } from "@apollo/client";

export const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user { id name email role village { id name } }
    }
  }
`;

export const VILLAGES = gql`
  query Villages { villages { id name } }
`;

export const MY_CASES = gql`
  query MyCases {
    myCases {
      id status score createdAt
      incidentType urgency
      childName abuserName
      village { id name }
      attachments { id filename mimeType sizeBytes downloadUrl createdAt }
    }
  }
`;

export const CREATE_CASE = gql`
  mutation CreateCase($input: CreateCaseInput!) {
    createCase(input: $input) {
      id status score
      village { id name }
      incidentType urgency
    }
  }
`;

export const PSY_CASES = gql`
  query PsyAssignedCases {
    psyAssignedCases {
      id status score createdAt
      incidentType urgency
      childName abuserName
      description
      village { id name }
      attachments { id filename mimeType sizeBytes downloadUrl createdAt }
      documents { id docType filename mimeType sizeBytes downloadUrl createdAt }
    }
  }
`;

export const DIR_VILLAGE_CASES = gql`
  query DirVillageCases {
    dirVillageCases {
      id status score createdAt
      incidentType urgency
      childName abuserName
      description
      village { id name }
      attachments { id filename mimeType sizeBytes downloadUrl createdAt }
      documents { id docType filename mimeType sizeBytes downloadUrl createdAt }
      dirVillageValidatedAt
      dirVillageSignature
      sauvegardeValidatedAt
      sauvegardeSignature
    }
  }
`;

export const SAUVEGARDE_CASES = gql`
  query SauvegardeCases {
    sauvegardeCases {
      id status score createdAt
      incidentType urgency
      childName abuserName
      description
      village { id name }
      attachments { id filename mimeType sizeBytes downloadUrl createdAt }
      documents { id docType filename mimeType sizeBytes downloadUrl createdAt }
      dirVillageValidatedAt
      dirVillageSignature
      sauvegardeValidatedAt
      sauvegardeSignature
    }
  }
`;

export const PSY_UPDATE_STATUS = gql`
  mutation PsyUpdateCaseStatus($caseId: ID!, $status: CaseStatus!) {
    psyUpdateCaseStatus(caseId: $caseId, status: $status) { id status score }
  }
`;

export const PSY_UPLOAD_DOC = gql`
  mutation PsyUploadDocument($caseId: ID!, $docType: DocumentType!, $file: FileInput!) {
    psyUploadDocument(caseId: $caseId, docType: $docType, file: $file) {
      id docType filename mimeType sizeBytes downloadUrl createdAt
    }
  }
`;

export const DIR_VILLAGE_VALIDATE_CASE = gql`
  mutation DirVillageValidateCase($caseId: ID!, $signatureFile: FileInput!) {
    dirVillageValidateCase(caseId: $caseId, signatureFile: $signatureFile) {
      id
      dirVillageValidatedAt
      dirVillageSignature
    }
  }
`;

export const SAUVEGARDE_VALIDATE_CASE = gql`
  mutation SauvegardeValidateCase($caseId: ID!, $signatureFile: FileInput!) {
    sauvegardeValidateCase(caseId: $caseId, signatureFile: $signatureFile) {
      id
      sauvegardeValidatedAt
      sauvegardeSignature
    }
  }
`;
